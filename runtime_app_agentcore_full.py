# DEPLOY_MARKER=1776337911
import json
import os
import re
import urllib.parse
from typing import Any

import boto3
import requests
from bedrock_agentcore.runtime import BedrockAgentCoreApp
from botocore.exceptions import ClientError

app = BedrockAgentCoreApp()
APP_VERSION = "2026-03-13-structured-deterministic-v7"

_SETTINGS: dict[str, Any] | None = None
_AC_RUNTIME = None

STOPWORDS = {
    "about",
    "a",
    "an",
    "and",
    "are",
    "as",
    "at",
    "be",
    "by",
    "does",
    "document",
    "for",
    "from",
    "how",
    "in",
    "include",
    "into",
    "is",
    "it",
    "of",
    "on",
    "or",
    "say",
    "source",
    "sources",
    "that",
    "the",
    "this",
    "to",
    "what",
    "with",
}

AGENT_CTX: dict[str, Any] = {
    "doc_id": "",
    "access_token": "",
    "oauth_session_uri": "",
    "mcp_session_id": "",
    "consent_pending": "0",
    "max_doc_calls": 1,
    "doc_call_count": 0,
    "doc_cached_result": "",
    "last_authorization_url": "",
    "last_oauth_session_uri": "",
    "oauth_return_url": "",
    "force_authentication": "0",
}


def get_settings() -> dict[str, Any]:
    global _SETTINGS
    if _SETTINGS is None:
        google_api_key = os.environ.get("GOOGLE_API_KEY", "").strip()
        if not google_api_key:
            raise RuntimeError("Missing GOOGLE_API_KEY environment variable.")
        _SETTINGS = {
            "GATEWAY_URL": os.environ["GATEWAY_URL"],
            "GOOGLE_DOCS_TOOL_NAME": os.environ["GOOGLE_DOCS_TOOL_NAME"],
            "MCP_VERSION": os.environ.get("GATEWAY_MCP_VERSION", "2025-11-25"),
            "AWS_REGION": os.environ.get("AWS_REGION", "us-east-1"),
            "GOOGLE_MODEL_ID": os.environ.get("GOOGLE_MODEL_ID", "gemini-2.5-flash"),
            "GOOGLE_API_KEY": google_api_key,
            "DOC_CONTEXT_MAX_CHARS": int(os.environ.get("DOC_CONTEXT_MAX_CHARS", "12000")),
            "GOOGLE_MAX_OUTPUT_TOKENS": int(os.environ.get("GOOGLE_MAX_OUTPUT_TOKENS", "512")),
        }
    return _SETTINGS


def get_ac_runtime():
    global _AC_RUNTIME
    if _AC_RUNTIME is None:
        _AC_RUNTIME = boto3.client(
            "bedrock-agentcore",
            region_name=get_settings()["AWS_REGION"],
        )
    return _AC_RUNTIME


def mcp_request(
    bearer_token: str,
    method: str,
    params: dict[str, Any],
    mcp_session_id: str | None = None,
) -> dict[str, Any]:
    settings = get_settings()
    headers = {
        "Authorization": f"Bearer {bearer_token}",
        "Content-Type": "application/json",
        "MCP-Protocol-Version": os.environ.get("GATEWAY_MCP_VERSION", "2025-11-25"),
    }
    if mcp_session_id and not mcp_session_id.startswith("urn:ietf:params:oauth:request_uri:"):
        headers["x-mcp-session-id"] = mcp_session_id

    response = requests.post(
        os.environ["GATEWAY_URL"],
        headers=headers,
        json={"jsonrpc": "2.0", "id": 1, "method": method, "params": params},
        timeout=60,
    )
    response.raise_for_status()
    return response.json()


def extract_mcp_text(payload: dict[str, Any]) -> str:
    content = payload.get("result", {}).get("content", [])
    parts = []
    for item in content:
        if isinstance(item, dict) and item.get("type") == "text":
            parts.append(str(item.get("text", "")))
    return "\n".join(parts).strip()


def parse_google_doc_payload(mcp_payload: dict[str, Any]) -> dict[str, Any]:
    merged = extract_mcp_text(mcp_payload)
    if not merged:
        return {}
    try:
        obj = json.loads(merged)
    except Exception:
        return {}

    if isinstance(obj, dict) and "body" in obj and isinstance(obj["body"], str):
        try:
            return json.loads(obj["body"])
        except Exception:
            return {"raw_body": obj["body"]}
    return obj if isinstance(obj, dict) else {}


def _collect_text_runs(node: Any, out: list[str]) -> None:
    if isinstance(node, dict):
        text_run = node.get("textRun")
        if isinstance(text_run, dict):
            content = str(text_run.get("content", ""))
            if content:
                out.append(content)
        for value in node.values():
            _collect_text_runs(value, out)
        return

    if isinstance(node, list):
        for item in node:
            _collect_text_runs(item, out)


def extract_google_doc_text(doc: dict[str, Any]) -> str:
    chunks: list[str] = []
    # Parse across the whole document object, not only body.content,
    # because newer Google Docs payloads can keep text under tabs.
    _collect_text_runs(doc, chunks)
    merged = "".join(chunks).replace("\r\n", "\n").replace("\r", "\n")

    normalized_lines: list[str] = []
    previous_blank = False
    for raw_line in merged.split("\n"):
        line = re.sub(r"[ \t]+", " ", raw_line).strip()
        is_blank = not line
        if is_blank and previous_blank:
            continue
        normalized_lines.append(line)
        previous_blank = is_blank

    return "\n".join(normalized_lines).strip()


def extract_elicitation_url(payload: dict[str, Any]) -> str | None:
    try:
        return payload["error"]["data"]["elicitations"][0]["url"]
    except Exception:
        return None


def extract_request_uri_from_url(url: str | None) -> str | None:
    if not url:
        return None
    query = urllib.parse.parse_qs(urllib.parse.urlparse(url).query)
    values = query.get("request_uri")
    if not values:
        return None
    return urllib.parse.unquote(values[0])


def build_authorization_url(request_uri: str | None) -> str:
    if not request_uri:
        return ""
    encoded = urllib.parse.quote(request_uri, safe="")
    return (
        "https://bedrock-agentcore."
        f"{get_settings()['AWS_REGION']}.amazonaws.com/identities/oauth2/authorize?request_uri={encoded}"
    )


def complete_oauth_session(access_token: str, oauth_session_uri: str) -> None:
    get_ac_runtime().complete_resource_token_auth(
        userIdentifier={"userToken": access_token},
        sessionUri=oauth_session_uri,
    )


def message_to_text(msg: Any) -> str:
    content = getattr(msg, "content", msg)
    if isinstance(content, str):
        return content
    if isinstance(content, list):
        parts = []
        for item in content:
            if isinstance(item, str):
                parts.append(item)
            elif isinstance(item, dict):
                if "text" in item:
                    parts.append(str(item["text"]))
                else:
                    parts.append(json.dumps(item, ensure_ascii=False))
            else:
                parts.append(str(item))
        return "\n".join(parts)
    return str(content)


def parse_tool_output(tool_text: str) -> dict[str, str]:
    out = {
        "kind": "other",
        "authorization_url": "",
        "oauth_session_uri": "",
        "document_text": "",
        "source_url": "",
    }

    if tool_text.startswith("CONSENT_REQUIRED"):
        out["kind"] = "consent"
        auth = re.search(r"authorization_url:\s*(https?://\S+)", tool_text)
        sess = re.search(r"oauth_session_uri:\s*(\S+)", tool_text)
        out["authorization_url"] = auth.group(1) if auth else ""
        out["oauth_session_uri"] = sess.group(1) if sess else ""
        return out

    if tool_text.startswith("ERROR:"):
        out["kind"] = "error"
        return out

    if tool_text.startswith("EMPTY_DOCUMENT"):
        out["kind"] = "empty"
        src = re.search(r"SOURCE:\s*(https?://\S+)", tool_text)
        out["source_url"] = src.group(1) if src else ""
        return out

    if tool_text.startswith("DOCUMENT_TEXT:"):
        out["kind"] = "document"
        source_split = tool_text.split("\n\nSOURCE:", 1)
        body = source_split[0].replace("DOCUMENT_TEXT:\n", "", 1)
        out["document_text"] = body.strip()
        if len(source_split) > 1:
            out["source_url"] = source_split[1].strip()
        return out

    return out


def _candidate_bullets_from_text(doc_text: str) -> list[str]:
    bullets: list[str] = []
    seen: set[str] = set()

    for raw_line in doc_text.split("\n"):
        line = re.sub(r"^\s*(?:[-*]|\d+[.)])\s*", "", raw_line).strip()
        if not line:
            continue
        if len(line.split()) < 5:
            continue
        if line.lower().startswith("sources:"):
            continue
        if not re.search(r"[.!?]$", line):
            line = f"{line}."
        if line not in seen:
            bullets.append(line)
            seen.add(line)

    if bullets:
        return bullets

    for sentence in re.split(r"(?<=[.!?])\s+", doc_text.replace("\n", " ")):
        sentence = sentence.strip()
        if len(sentence.split()) < 5:
            continue
        if sentence not in seen:
            bullets.append(sentence)
            seen.add(sentence)

    return bullets


def extract_query_terms(prompt: str) -> set[str]:
    words = re.findall(r"[a-zA-Z][a-zA-Z0-9_-]{2,}", prompt.lower())
    return {word for word in words if word not in STOPWORDS}


def is_summary_prompt(prompt: str) -> bool:
    text = prompt.lower()
    markers = (
        "summarize",
        "summary",
        "summarise",
        "key points",
        "overview",
        "6 bullets",
        "bullets",
    )
    return any(marker in text for marker in markers)


def candidate_sentences(doc_text: str) -> list[str]:
    lines = _candidate_bullets_from_text(doc_text)
    if lines:
        return lines

    sentences: list[str] = []
    seen: set[str] = set()
    for sentence in re.split(r"(?<=[.!?])\s+", doc_text.replace("\n", " ")):
        cleaned = re.sub(r"\s+", " ", sentence).strip(" -*")
        if len(cleaned.split()) < 5:
            continue
        if cleaned not in seen:
            sentences.append(cleaned)
            seen.add(cleaned)
    return sentences


def build_structured_answer(
    prompt: str,
    doc_text: str,
    source_url: str,
    max_bullets: int = 6,
) -> dict[str, Any]:
    candidates = candidate_sentences(doc_text)
    sources = [source_url] if source_url else []
    query_terms = extract_query_terms(prompt)
    summary_prompt = is_summary_prompt(prompt)

    if not candidates:
        return {
            "kind": "not_found",
            "query": prompt,
            "bullets": [],
            "sources": sources,
            "message": "Not found in document.",
        }

    scored: list[tuple[int, int, str]] = []
    for idx, candidate in enumerate(candidates):
        lowered = candidate.lower()
        score = sum(1 for term in query_terms if term in lowered)
        scored.append((score, idx, candidate))

    relevant = [item for item in scored if item[0] > 0]
    if query_terms and not summary_prompt and not relevant:
        return {
            "kind": "not_found",
            "query": prompt,
            "bullets": [],
            "sources": sources,
            "message": "Not found in document.",
        }

    if summary_prompt:
        bullets = candidates[:max_bullets]
    else:
        ranked = relevant if relevant else scored
        ranked = sorted(ranked, key=lambda item: (-item[0], item[1]))
        selected = sorted(ranked[:max_bullets], key=lambda item: item[1])
        bullets = [candidate for _, _, candidate in selected]

    return {
        "kind": "bullet_summary",
        "query": prompt,
        "bullets": bullets,
        "sources": sources,
        "message": "",
    }


def render_structured_answer(answer: dict[str, Any]) -> str:
    kind = answer.get("kind")
    if kind == "not_found":
        body = str(answer.get("message") or "Not found in document.")
    else:
        bullets = [str(item).strip() for item in answer.get("bullets", []) if str(item).strip()]
        if not bullets:
            body = "Not found in document."
        else:
            body = "\n".join(f"- {bullet}" for bullet in bullets)

    sources = [str(item).strip() for item in answer.get("sources", []) if str(item).strip()]
    if sources:
        body = f"{body}\n\nSources:\n" + "\n".join(f"- {item}" for item in sources)
    return body


def get_google_doc(query: str = "") -> str:
    """Fetch Google Doc via Gateway MCP (OAuth handled by Gateway)."""
    # Local settings fallback
    settings = {
        "GATEWAY_URL": os.environ.get("GATEWAY_URL", ""),
        "GOOGLE_DOCS_TOOL_NAME": os.environ.get("GOOGLE_DOCS_TOOL_NAME", ""),
        "MCP_VERSION": os.environ.get("GATEWAY_MCP_VERSION", "2025-11-25"),
        "DOC_CONTEXT_MAX_CHARS": os.environ.get("DOC_CONTEXT_MAX_CHARS", "12000"),
        "GOOGLE_PROVIDER_NAME": os.environ.get("GOOGLE_PROVIDER_NAME", "acwslite_google_provider"),
        "AWS_REGION": os.environ.get("AWS_REGION", "us-east-1"),
    }
    doc_id = AGENT_CTX.get("doc_id", "")
    user_token = AGENT_CTX.get("access_token", "")
    max_doc_calls = int(AGENT_CTX.get("max_doc_calls", 1))
    doc_call_count = int(AGENT_CTX.get("doc_call_count", 0))
    cached = str(AGENT_CTX.get("doc_cached_result", ""))

    if not doc_id:
        return "ERROR: doc_id is empty in agent context."
    if not user_token:
        return "ERROR: user_access_token is missing in agent context."
    if doc_call_count >= max_doc_calls and cached:
        return cached

    import logging as _logging
    _log = _logging.getLogger(__name__)

    try:
        gateway_url = os.environ["GATEWAY_URL"]
        tool_name = os.environ["GOOGLE_DOCS_TOOL_NAME"]
        mcp_version = os.environ.get("GATEWAY_MCP_VERSION", "2025-11-25")

        headers = {
            "Authorization": f"Bearer {user_token}",
            "Content-Type": "application/json",
            "MCP-Protocol-Version": mcp_version,
        }

        _log.warning(f"DEBUG: Gateway MCP call, doc_id={doc_id[:8]}..., gateway={gateway_url[:50]}")

        # Step 1: MCP initialize (declares elicitation support)
        init_resp = requests.post(gateway_url, headers=headers, json={
            "jsonrpc": "2.0", "id": 0, "method": "initialize",
            "params": {
                "protocolVersion": mcp_version,
                "capabilities": {"elicitation": {}},
                "clientInfo": {"name": "runtime-agent", "version": "1.0.0"},
            },
        }, timeout=(10, 60))

        session_id = init_resp.headers.get("Mcp-Session-Id", "")
        if session_id:
            headers["Mcp-Session-Id"] = session_id

        # Step 2: tools/call for getDocument
        call_resp = requests.post(gateway_url, headers=headers, json={
            "jsonrpc": "2.0", "id": 1, "method": "tools/call",
            "params": {
                "name": tool_name,
                "arguments": {"documentId": doc_id},
            },
        }, timeout=(10, 120))
        call_json = call_resp.json()

        # Handle OAuth elicitation (-32042)
        mcp_error = call_json.get("error")
        if isinstance(mcp_error, dict) and mcp_error.get("code") == -32042:
            elicitations = (mcp_error.get("data") or {}).get("elicitations") or []
            auth_url = elicitations[0].get("url", "") if elicitations else ""
            _log.warning(f"DEBUG: OAuth elicitation, url={auth_url[:80]}")
            AGENT_CTX["consent_pending"] = "1"
            AGENT_CTX["last_authorization_url"] = auth_url
            req_uri = extract_request_uri_from_url(auth_url) or ""
            AGENT_CTX["last_oauth_session_uri"] = req_uri
            return (
                f"CONSENT_REQUIRED\n"
                f"authorization_url: {auth_url}\n"
                f"oauth_session_uri: {req_uri}"
            )

        # Handle tool error
        result = call_json.get("result", {})
        if result.get("isError"):
            err_text = ""
            for block in result.get("content", []):
                if isinstance(block, dict):
                    err_text += block.get("text", "")
            _log.warning(f"DEBUG: Gateway tool error: {err_text[:200]}")
            return f"ERROR: Gateway returned: {err_text}"

        # Success — extract document text
        raw_text = ""
        for block in result.get("content", []):
            if isinstance(block, dict) and block.get("type") == "text":
                raw_text += block.get("text", "")

        try:
            doc_json = json.loads(raw_text)
            doc_plain = extract_google_doc_text(doc_json)
        except Exception:
            doc_plain = raw_text

        source_url = f"https://docs.google.com/document/d/{doc_id}/edit"
        result_text = f"DOCUMENT_TEXT:\n{doc_plain}\n\nSOURCE: {source_url}"

        AGENT_CTX["doc_call_count"] = str(doc_call_count + 1)
        AGENT_CTX["doc_cached_result"] = result_text
        _log.warning(f"DEBUG: Got doc via Gateway, plain_len={len(doc_plain)}")

        return result_text

    except Exception as exc:
        _log.warning(f"DEBUG: get_google_doc EXCEPTION: {type(exc).__name__}: {exc}")
        return f"ERROR: get_google_doc failed: {type(exc).__name__}: {exc}"
def _session_from_context(context: Any) -> str:
    if context is None:
        return ""
    if isinstance(context, dict):
        return str(context.get("session_id") or context.get("sessionId") or "")
    return str(getattr(context, "session_id", None) or getattr(context, "sessionId", None) or "")


@app.entrypoint
def invoke(payload: dict, context=None):
    thread_id = str(payload.get("thread_id") or "").strip() or _session_from_context(context) or "runtime-default-thread"

    AGENT_CTX["doc_id"] = str(payload.get("doc_id", "")).strip()
    AGENT_CTX["access_token"] = str(payload.get("user_access_token", "")).strip()
    AGENT_CTX["oauth_session_uri"] = str(payload.get("oauth_session_uri", "")).strip()
    AGENT_CTX["mcp_session_id"] = str(payload.get("mcp_session_id", "")).strip() or thread_id
    AGENT_CTX["consent_pending"] = "0"
    AGENT_CTX["oauth_return_url"] = str(payload.get("oauth_return_url", "")).strip()
    AGENT_CTX["force_authentication"] = "1" if bool(payload.get("force_authentication", False)) else "0"

    try:
        AGENT_CTX["max_doc_calls"] = max(1, min(3, int(payload.get("max_doc_calls", 1))))
    except (TypeError, ValueError):
        AGENT_CTX["max_doc_calls"] = 1

    AGENT_CTX["doc_call_count"] = 0
    AGENT_CTX["doc_cached_result"] = ""
    AGENT_CTX["last_authorization_url"] = ""
    AGENT_CTX["last_oauth_session_uri"] = ""

    try:
        max_steps = int(payload.get("max_steps", 5))
    except (TypeError, ValueError):
        max_steps = 5
    recursion_limit = max(2, min(8, max_steps))

    tool_text = get_google_doc()
    import logging as _log2; _log2.getLogger(__name__).warning(f"RAW_TOOL_TEXT_FIRST80: {repr(tool_text[:80])}")
    parsed = parse_tool_output(tool_text)

    trace = [
        {
            "step": 1,
            "event": "tool_call",
            "tool": "get_google_doc",
            "args": {"documentId": AGENT_CTX.get("doc_id", "")},
        },
        {
            "step": 2,
            "event": "tool_result",
            "tool": "get_google_doc",
            "preview": tool_text[:240] + ("..." if len(tool_text) > 240 else ""),
        },
    ]

    authorization_url = ""
    oauth_session_uri = ""
    consent_required = False
    answer_mode = "tool_only"
    answer_payload: dict[str, Any] = {
        "kind": "tool_only",
        "query": str(payload.get("prompt", "")),
        "bullets": [],
        "sources": [],
        "message": "",
    }

    if parsed["kind"] == "consent":
        oauth_session_uri = parsed.get("oauth_session_uri", "")
        raw_auth = parsed.get("authorization_url", "")
        if not oauth_session_uri:
            oauth_session_uri = extract_request_uri_from_url(raw_auth) or ""
        authorization_url = build_authorization_url(oauth_session_uri) if oauth_session_uri else raw_auth
        consent_required = bool(authorization_url)
        answer = (
            "Google consent required.\n"
            f"authorization_url: {authorization_url}\n"
            f"oauth_session_uri: {oauth_session_uri}\n"
            "Complete consent in browser, then re-run with the same oauth_session_uri."
        )
        answer_payload = {
            "kind": "consent",
            "query": str(payload.get("prompt", "")),
            "bullets": [],
            "sources": [],
            "message": answer,
        }
    elif parsed["kind"] == "error":
        answer = tool_text
        answer_mode = "error"
        answer_payload = {
            "kind": "error",
            "query": str(payload.get("prompt", "")),
            "bullets": [],
            "sources": [],
            "message": answer,
        }
    elif parsed["kind"] == "empty":
        src = parsed.get("source_url", "")
        answer = "The document is empty."
        if src:
            answer += f"\n\nSources:\n- {src}"
        answer_mode = "empty"
        answer_payload = {
            "kind": "empty",
            "query": str(payload.get("prompt", "")),
            "bullets": [],
            "sources": [src] if src else [],
            "message": "The document is empty.",
        }
    elif parsed["kind"] == "document":
        doc_text = parsed.get("document_text", "")
        source_url = parsed.get("source_url", "")
        if not doc_text:
            answer = "ERROR: Document text is empty after parsing tool result."
            answer_mode = "error"
            answer_payload = {
                "kind": "error",
                "query": str(payload.get("prompt", "")),
                "bullets": [],
                "sources": [source_url] if source_url else [],
                "message": answer,
            }
        else:
            prompt_text = str(payload.get("prompt", "")).strip()
            doc_for_answer = doc_text[: get_settings()["DOC_CONTEXT_MAX_CHARS"]]
            answer_payload = build_structured_answer(
                prompt=prompt_text,
                doc_text=doc_for_answer,
                source_url=source_url,
            )
            answer = render_structured_answer(answer_payload)
            answer_mode = "deterministic_extractive"
    else:
        answer = "ERROR: Unexpected tool output format."
        answer_mode = "error"
        answer_payload = {
            "kind": "error",
            "query": str(payload.get("prompt", "")),
            "bullets": [],
            "sources": [],
            "message": answer,
        }

    return {
        "app_version": APP_VERSION,
        "recursion_limit": recursion_limit,
        "response": answer,
        "answer": answer_payload,
        "tool_trace": trace,
        "tools_used": ["get_google_doc"],
        "tool_call_counts": {
            "get_google_doc": AGENT_CTX.get("doc_call_count", 0),
        },
        "tool_call_limits": {
            "get_google_doc": AGENT_CTX.get("max_doc_calls", 1),
        },
        "answer_mode": answer_mode,
        "consent_required": consent_required,
        "authorization_url": authorization_url,
        "oauth_session_uri": oauth_session_uri,
        "thread_id": thread_id,
    }


if __name__ == "__main__":
    app.run()
