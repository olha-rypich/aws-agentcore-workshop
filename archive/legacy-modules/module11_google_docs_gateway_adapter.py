import json
import os
import uuid
from urllib.parse import parse_qs, unquote, urlparse
from typing import Any

import boto3
import requests
from botocore.exceptions import ClientError
from dotenv import load_dotenv

load_dotenv()
# Gateway workshop defaults should override stale shell exports from older modules.
load_dotenv(".gateway_auth.env", override=True)


GATEWAY_URL = os.getenv("GATEWAY_URL")
GATEWAY_TOKEN_ENDPOINT = os.getenv("GATEWAY_TOKEN_ENDPOINT")
GATEWAY_CLIENT_ID = os.getenv("GATEWAY_CLIENT_ID")
GATEWAY_CLIENT_SECRET = os.getenv("GATEWAY_CLIENT_SECRET")
GATEWAY_SCOPE = os.getenv("GATEWAY_SCOPE")
GATEWAY_BEARER_TOKEN = os.getenv("GATEWAY_BEARER_TOKEN")
GOOGLE_DOCS_TOOL_NAME = os.getenv("GOOGLE_DOCS_TOOL_NAME", "")
GATEWAY_MCP_VERSION = os.getenv("GATEWAY_MCP_VERSION")
GATEWAY_MCP_SESSION_ID = os.getenv("GATEWAY_MCP_SESSION_ID", f"m11-{uuid.uuid4().hex[:24]}")
GATEWAY_OAUTH_SESSION_URI = os.getenv("GATEWAY_OAUTH_SESSION_URI")


def _require_env(name: str, value: str | None) -> str:
    if value:
        return value
    raise RuntimeError(f"Missing required env var: {name}")


def get_gateway_token() -> str:
    # If a user JWT is provided explicitly, prefer it over M2M token fetch.
    bearer_token = os.getenv("GATEWAY_BEARER_TOKEN") or GATEWAY_BEARER_TOKEN
    if bearer_token:
        return bearer_token

    token_endpoint = _require_env(
        "GATEWAY_TOKEN_ENDPOINT", os.getenv("GATEWAY_TOKEN_ENDPOINT") or GATEWAY_TOKEN_ENDPOINT
    )
    client_id = _require_env("GATEWAY_CLIENT_ID", os.getenv("GATEWAY_CLIENT_ID") or GATEWAY_CLIENT_ID)
    client_secret = _require_env(
        "GATEWAY_CLIENT_SECRET", os.getenv("GATEWAY_CLIENT_SECRET") or GATEWAY_CLIENT_SECRET
    )
    scope = _require_env("GATEWAY_SCOPE", os.getenv("GATEWAY_SCOPE") or GATEWAY_SCOPE)

    response = requests.post(
        token_endpoint,
        data={
            "grant_type": "client_credentials",
            "client_id": client_id,
            "client_secret": client_secret,
            "scope": scope,
        },
        timeout=30,
    )
    response.raise_for_status()
    payload = response.json()
    token = payload.get("access_token")
    if not token:
        raise RuntimeError("Gateway token response does not contain access_token")
    return token


def mcp_request(method: str, params: dict[str, Any]) -> dict[str, Any]:
    gateway_url = _require_env("GATEWAY_URL", os.getenv("GATEWAY_URL") or GATEWAY_URL)
    token = get_gateway_token()
    headers = {"Authorization": f"Bearer {token}", "Content-Type": "application/json"}
    mcp_version = os.getenv("GATEWAY_MCP_VERSION") or GATEWAY_MCP_VERSION
    if mcp_version:
        headers["MCP-Protocol-Version"] = mcp_version
    mcp_session_id = os.getenv("GATEWAY_MCP_SESSION_ID") or GATEWAY_MCP_SESSION_ID
    # OAuth request_uri is NOT an MCP session id; don't send it as MCP header.
    if mcp_session_id and not mcp_session_id.startswith("urn:ietf:params:oauth:request_uri:"):
        headers["x-mcp-session-id"] = mcp_session_id

    response = requests.post(
        gateway_url,
        json={"jsonrpc": "2.0", "id": 1, "method": method, "params": params},
        headers=headers,
        timeout=60,
    )
    if response.status_code >= 400:
        # Provide actionable context for common workshop auth pitfalls.
        body_preview = response.text[:600]
        wants_user_federation = bool(
            isinstance(params, dict)
            and isinstance(params.get("_meta"), dict)
            and "aws.bedrock-agentcore.gateway/credentialProviderConfiguration" in params.get("_meta", {})
        )
        if response.status_code == 403 and wants_user_federation:
            raise RuntimeError(
                "Gateway returned 403 while requesting OAuth USER_FEDERATION metadata.\n"
                "Likely cause: inbound token is client_credentials (M2M) and has no end-user identity.\n"
                "Current gateway authorizer/client usually supports only M2M by default.\n"
                "You need a user-flow Cognito app client (USER_PASSWORD_AUTH or Hosted UI) added to "
                "gateway allowedClients, then call Gateway with that user JWT.\n"
                f"Response body: {body_preview}"
            )
        raise RuntimeError(
            f"Gateway HTTP {response.status_code} for method={method}. "
            f"Response body: {body_preview}"
        )

    data = response.json()
    if "error" in data:
        # Expected OAuth challenge shape for 3LO flows.
        error = data.get("error", {})
        if error.get("code") == -32042:
            return data
        raise RuntimeError(f"MCP error: {data['error']}")
    return data


def list_tools() -> list[dict[str, Any]]:
    result = mcp_request("tools/list", {})
    return result.get("result", {}).get("tools", [])


def resolve_google_docs_tool_name() -> str:
    tool_name = os.getenv("GOOGLE_DOCS_TOOL_NAME") or GOOGLE_DOCS_TOOL_NAME
    if tool_name:
        return tool_name

    tools = list_tools()
    for tool in tools:
        name = tool.get("name", "")
        lowered = name.lower()
        if "google" in lowered and "doc" in lowered:
            return name

    raise RuntimeError(
        "Google Docs tool not found. Set GOOGLE_DOCS_TOOL_NAME explicitly "
        "(example: my-target___getDocument)."
    )


def call_google_docs_tool(
    document_id: str,
    *,
    return_url: str | None = None,
    force_authentication: bool = False,
) -> dict[str, Any]:
    _complete_oauth_session_if_available()
    tool_name = resolve_google_docs_tool_name()
    params: dict[str, Any] = {
        "name": tool_name,
        "arguments": {"documentId": document_id},
    }

    if return_url or force_authentication:
        if not (os.getenv("GATEWAY_BEARER_TOKEN") or GATEWAY_BEARER_TOKEN):
            raise RuntimeError(
                "OAuth user-federation call requires end-user JWT.\n"
                "Set GATEWAY_BEARER_TOKEN to a Cognito USER access token first, "
                "or run without oauth_return_url/force_authentication for M2M-only flow."
            )
        oauth_provider_meta: dict[str, Any] = {}
        if return_url:
            oauth_provider_meta["returnUrl"] = return_url
        if force_authentication:
            oauth_provider_meta["forceAuthentication"] = True

        params["_meta"] = {
            "aws.bedrock-agentcore.gateway/credentialProviderConfiguration": {
                "oauthCredentialProvider": oauth_provider_meta
            }
        }

    return mcp_request("tools/call", params)


def _complete_oauth_session_if_available() -> None:
    """
    Finalize OAuth 3LO session after browser consent.
    Expects session URI from callback as GATEWAY_OAUTH_SESSION_URI (preferred)
    or GATEWAY_MCP_SESSION_ID (legacy compatibility if it contains request_uri URN).
    """
    user_token = os.getenv("GATEWAY_BEARER_TOKEN") or GATEWAY_BEARER_TOKEN
    if not user_token:
        return

    session_uri = os.getenv("GATEWAY_OAUTH_SESSION_URI") or GATEWAY_OAUTH_SESSION_URI
    if not session_uri:
        maybe_legacy = os.getenv("GATEWAY_MCP_SESSION_ID")
        if maybe_legacy and maybe_legacy.startswith("urn:ietf:params:oauth:request_uri:"):
            session_uri = maybe_legacy
    if not session_uri or not session_uri.startswith("urn:ietf:params:oauth:request_uri:"):
        return

    region = os.getenv("AWS_REGION", "us-east-1")
    profile = os.getenv("AWS_PROFILE")
    if profile:
        session = boto3.Session(profile_name=profile, region_name=region)
    else:
        session = boto3.Session(region_name=region)
    client = session.client("bedrock-agentcore", region_name=region)
    try:
        client.complete_resource_token_auth(
            userIdentifier={"userToken": user_token},
            sessionUri=session_uri,
        )
    except ClientError as exc:
        # If not authorized yet or session expired, keep normal flow (Gateway will return consent URL).
        code = exc.response.get("Error", {}).get("Code", "")
        if code in {"AccessDeniedException", "ValidationException"}:
            return
        raise


def extract_mcp_text(result: dict[str, Any]) -> str:
    content = result.get("result", {}).get("content", [])
    text_parts: list[str] = []
    for block in content:
        if isinstance(block, dict) and block.get("type") == "text":
            text_parts.append(str(block.get("text", "")))
    return "\n".join(text_parts).strip()


def parse_google_docs_payload(mcp_result: dict[str, Any]) -> dict[str, Any]:
    text = extract_mcp_text(mcp_result)
    if not text:
        return {}

    try:
        raw = json.loads(text)
    except json.JSONDecodeError:
        return {}

    # OpenAPI targets often return {"statusCode": 200, "body": "...json..."}.
    if isinstance(raw, dict) and "body" in raw:
        body = raw["body"]
        if isinstance(body, str):
            try:
                return json.loads(body)
            except json.JSONDecodeError:
                return {"raw_body": body}
        if isinstance(body, dict):
            return body
    return raw if isinstance(raw, dict) else {}


def extract_authorization_url(payload: Any) -> str | None:
    if isinstance(payload, dict):
        # 3LO elicitation format:
        # {"error":{"data":{"elicitations":[{"mode":"url","url":"..."}]}}}
        error = payload.get("error")
        if isinstance(error, dict):
            data = error.get("data")
            if isinstance(data, dict):
                elicitations = data.get("elicitations")
                if isinstance(elicitations, list):
                    for item in elicitations:
                        if isinstance(item, dict) and isinstance(item.get("url"), str):
                            return item["url"]
        for key, value in payload.items():
            if key.lower() == "authorizationurl" and isinstance(value, str):
                return value
            nested = extract_authorization_url(value)
            if nested:
                return nested
    elif isinstance(payload, list):
        for item in payload:
            nested = extract_authorization_url(item)
            if nested:
                return nested
    return None


def extract_google_doc_text(doc: dict[str, Any]) -> str:
    body = doc.get("body", {})
    content = body.get("content", [])
    lines: list[str] = []

    for item in content:
        paragraph = item.get("paragraph")
        if not paragraph:
            continue
        elements = paragraph.get("elements", [])
        parts: list[str] = []
        for el in elements:
            text_run = el.get("textRun")
            if text_run:
                parts.append(text_run.get("content", ""))
        line = "".join(parts).strip()
        if line:
            lines.append(line)

    return "\n".join(lines)


def extract_oauth_session_id_from_authorization_url(url: str) -> str | None:
    """
    Extract OAuth session identifier from AgentCore authorization URL.
    For MCP 2025-11-25 flows this is usually the request_uri URN.
    """
    if not url:
        return None
    try:
        parsed = urlparse(url)
        q = parse_qs(parsed.query)
        request_uri_values = q.get("request_uri")
        if request_uri_values:
            return unquote(request_uri_values[0])
    except Exception:
        return None
    return None


if __name__ == "__main__":
    tools = list_tools()
    print("TOOLS:")
    for t in tools:
        print("-", t.get("name"))
