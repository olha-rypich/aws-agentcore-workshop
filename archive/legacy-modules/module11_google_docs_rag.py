import os
import re
from typing import Literal

from langgraph.graph import END, START, StateGraph
from typing_extensions import NotRequired, TypedDict

from module11_google_docs_gateway_adapter import (
    call_google_docs_tool,
    extract_authorization_url,
    extract_google_doc_text,
    extract_oauth_session_id_from_authorization_url,
    parse_google_docs_payload,
)

"""
LEARNER_TASKS (Module 11: Google Docs RAG via Gateway)

Goal:
- Query Google Docs through AgentCore Gateway.
- Convert document text into simple chunks.
- Retrieve top chunks by lexical overlap with user query.
- Return deterministic answer with evidence lines.

Before running this file:
1) Set gateway env vars (.env or shell):
   - GATEWAY_URL
   - GATEWAY_TOKEN_ENDPOINT
   - GATEWAY_CLIENT_ID
   - GATEWAY_CLIENT_SECRET
   - GATEWAY_SCOPE
2) Set GOOGLE_DOCS_TOOL_NAME for your Gateway target tool.
3) Pass a real Google Doc ID in run_test(..., doc_id=...).
"""


class GoogleDocsRagState(TypedDict):
    user_input: str
    doc_id: str
    oauth_return_url: NotRequired[str]
    force_authentication: NotRequired[bool]
    route: NotRequired[Literal["retrieve", "direct"]]
    tool_called: NotRequired[bool]
    authorization_url: NotRequired[str]
    oauth_session_uri: NotRequired[str]
    doc_text: NotRequired[str]
    top_chunks: NotRequired[list[str]]
    answer: NotRequired[str]


def route_node(state: GoogleDocsRagState):
    text = state["user_input"].lower()
    should_retrieve = any(k in text for k in ("doc", "document", "google", "policy", "what", "how"))
    return {"route": "retrieve" if should_retrieve else "direct"}


def route_decision(state: GoogleDocsRagState):
    return "retrieve_node" if state.get("route") == "retrieve" else "answer_node"


def _tokenize(text: str) -> set[str]:
    return set(re.findall(r"[a-zA-Z0-9]+", text.lower()))


def _chunk_text(doc_text: str, chunk_size: int = 450) -> list[str]:
    if not doc_text:
        return []

    paragraphs = [p.strip() for p in doc_text.split("\n") if p.strip()]
    chunks: list[str] = []
    current = ""
    for para in paragraphs:
        candidate = f"{current}\n{para}".strip() if current else para
        if len(candidate) <= chunk_size:
            current = candidate
        else:
            if current:
                chunks.append(current)
            current = para
    if current:
        chunks.append(current)
    return chunks


def retrieve_node(state: GoogleDocsRagState):
    try:
        mcp_result = call_google_docs_tool(
            state["doc_id"],
            return_url=state.get("oauth_return_url"),
            force_authentication=state.get("force_authentication", False),
        )
    except RuntimeError as exc:
        return {
            "tool_called": True,
            "authorization_url": "",
            "doc_text": "",
            "top_chunks": [],
            "answer": f"Retrieval failed: {exc}",
        }
    authorization_url = extract_authorization_url(mcp_result)
    if authorization_url:
        oauth_session_uri = extract_oauth_session_id_from_authorization_url(authorization_url) or ""
        return {
            "tool_called": True,
            "authorization_url": authorization_url,
            "oauth_session_uri": oauth_session_uri,
            "doc_text": "",
            "top_chunks": [],
        }

    payload = parse_google_docs_payload(mcp_result)
    doc_text = extract_google_doc_text(payload)

    query_tokens = _tokenize(state["user_input"])
    chunks = _chunk_text(doc_text)

    scored: list[tuple[float, str]] = []
    for c in chunks:
        chunk_tokens = _tokenize(c)
        if not chunk_tokens:
            continue
        overlap = len(query_tokens & chunk_tokens)
        score = overlap / len(chunk_tokens)
        scored.append((score, c))

    scored.sort(key=lambda x: x[0], reverse=True)
    top_chunks = [c for s, c in scored[:3] if s > 0]
    if not top_chunks:
        top_chunks = chunks[:2]

    return {
        "tool_called": True,
        "authorization_url": "",
        "doc_text": doc_text,
        "top_chunks": top_chunks,
    }


def answer_node(state: GoogleDocsRagState):
    if state.get("route") == "retrieve":
        if state.get("answer"):
            return {
                "answer": state["answer"],
                "tool_called": state.get("tool_called", True),
            }
        auth_url = state.get("authorization_url")
        if auth_url:
            oauth_session_uri = state.get("oauth_session_uri", "")
            session_hint = (
                f"\n\nAfter login, re-run with:\nexport GATEWAY_OAUTH_SESSION_URI='{oauth_session_uri}'\n"
                if oauth_session_uri
                else ""
            )
            return {
                "answer": (
                    "Google consent required. Open this URL, complete login/consent, "
                    f"then re-run the same request:\n{auth_url}{session_hint}"
                ),
                "tool_called": True,
            }

        chunks = state.get("top_chunks", [])
        if not chunks:
            return {
                "answer": "I could not find relevant passages in the document.",
                "tool_called": state.get("tool_called", False),
            }
        preview = "\n---\n".join(chunks)
        return {
            "answer": f"Retrieved evidence from Google Docs:\n{preview}",
            "tool_called": state.get("tool_called", False),
        }
    return {"answer": "Direct answer path: no retrieval requested.", "tool_called": False}


def build_graph():
    g = StateGraph(GoogleDocsRagState)
    g.add_node("route_node", route_node)
    g.add_node("retrieve_node", retrieve_node)
    g.add_node("answer_node", answer_node)

    g.add_edge(START, "route_node")
    g.add_conditional_edges(
        "route_node",
        route_decision,
        {"retrieve_node": "retrieve_node", "answer_node": "answer_node"},
    )
    g.add_edge("retrieve_node", "answer_node")
    g.add_edge("answer_node", END)
    return g.compile()


def run_test(graph, prompt: str, doc_id: str):
    state = {
        "user_input": prompt,
        "doc_id": doc_id,
    }
    # Keep default flow stable: do NOT attach OAuth metadata unless explicitly requested.
    # Set GOOGLE_USE_OAUTH_META=true when you want to force _meta returnUrl behavior.
    use_oauth_meta = os.getenv("GOOGLE_USE_OAUTH_META", "").lower() in {"1", "true", "yes"}
    oauth_return_url = os.getenv("GOOGLE_OAUTH_RETURN_URL")
    if use_oauth_meta and oauth_return_url:
        state["oauth_return_url"] = oauth_return_url
        if os.getenv("GOOGLE_FORCE_AUTH", "").lower() in {"1", "true", "yes"}:
            state["force_authentication"] = True

    result = graph.invoke(state)
    print("\nPrompt:", prompt)
    print("Route:", result.get("route"))
    print("Tool called:", result.get("tool_called"))
    print("Answer:\n", result.get("answer"))


if __name__ == "__main__":
    # Replace with a real Google Doc ID available to authenticated user.
    DOC_ID = "REPLACE_WITH_GOOGLE_DOC_ID"

    graph = build_graph()
    run_test(graph, "What does this document say about incident response?", DOC_ID)
