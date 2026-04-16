# Testing Guide: AgentCore E2E Solution

## Overview

This document explains how to test the workshop E2E solution step by step, which datasets to use, what expected results look like for each dataset type, and how to interpret errors and deviations.

**Architecture under test:** AgentCore Runtime · Inbound Auth (Cognito JWT) · Gateway (MCP 2025-11-25) · Outbound OAuth to Google Docs · Observability

---

## Part 1 — Prerequisites & Environment Setup

### 1.1 Required environment variables

Copy `.env.example` to `.env` and fill in all values before any test run:

```bash
cp .env.example .env
```

| Variable | Required | Description |
|---|---|---|
| `GOOGLE_CLIENT_ID` | ✅ | Google OAuth app client ID |
| `GOOGLE_CLIENT_SECRET` | ✅ | Google OAuth app client secret |
| `GOOGLE_DOC_ID` | ✅ | ID of the Google Doc under test |
| `GOOGLE_API_KEY` | ✅ | Google API key for Gemini model |
| `AWS_PROFILE` | optional | AWS CLI profile (default: `workshop`) |
| `AWS_REGION` | optional | AWS region (default: `us-east-1`) |
| `WORKSHOP_PREFIX` | optional | Resource name prefix (default: `acwslite`) |
| `OAUTH_RETURN_URL` | optional | Local OAuth callback (default: `http://localhost:8081/oauth2/callback`) |
| `GOOGLE_MODEL_ID` | optional | Gemini model (default: `gemini-2.5-flash`) |

**Validation check — run this before any test:**

```python
import os
required = ['GOOGLE_CLIENT_ID', 'GOOGLE_CLIENT_SECRET', 'GOOGLE_DOC_ID', 'GOOGLE_API_KEY']
missing = [k for k in required if not os.getenv(k)]
if missing:
    raise ValueError(f"Missing required env vars: {missing}")
print("✅ All required env vars present")
```

### 1.2 AWS credentials check

```bash
aws sts get-caller-identity --profile $AWS_PROFILE
```

Expected output: JSON with `Account`, `UserId`, `Arn`. If this fails, refresh your AWS credentials before proceeding.

### 1.3 Runtime deployment check

The runtime must be `ACTIVE` before running any test that invokes it:

```bash
agentcore status --agent <runtime_agent_name>
```

Expected: `status: ACTIVE`. If `CREATING` — wait 2–3 min and retry. If `FAILED` — re-deploy (see Step 4 of the notebook).

---

## Part 2 — Step-by-Step Testing Runbook

Run tests in the order below. Each step depends on the previous one being healthy.

### Step 1 — Inbound Auth: Obtain a Cognito JWT

**Goal:** Verify that Cognito is configured and a valid JWT can be obtained.

```python
from workshop_helpers.agentcore_demo import WorkshopE2EDemo
from pathlib import Path

demo = WorkshopE2EDemo(Path.cwd())
inbound = demo.ensure_inbound_auth()
token = demo.get_user_access_token()

print("user_pool_id:", inbound["user_pool_id"])
print("user_client_id:", inbound["user_client_id"])
print("token length:", len(token))
assert len(token) > 100, "Token looks too short"
assert token.count(".") == 2, "Token does not look like a JWT"
print("✅ Step 1 PASSED")
```

**Expected:** `token length` > 100, three dot-separated segments.

**If it fails:** Check that `DEMO_USERNAME` / `DEMO_PASSWORD` env vars match the user in the pool, or that `USER_PASSWORD_AUTH` is enabled on the App Client.

---

### Step 2 — Gateway Health: MCP tools/list

**Goal:** Verify Gateway is reachable and returns the Google Docs tool.

```python
gateway = demo.state.get("gateway") or demo.ensure_gateway()
result = demo.smoke_test_gateway()

print("gateway status:", result["status"])
print("google_docs_tool_name:", demo.state["gateway"].get("google_docs_tool_name"))
assert result["status"] == "healthy", f"Gateway not healthy: {result}"
print("✅ Step 2 PASSED")
```

**Expected:** `status: healthy`, `google_docs_tool_name` contains `getDocument`.

**If it fails:** Check `MCP-Protocol-Version` header is `2025-11-25`. Check that the Gateway is `READY` (not `CREATING`). Check that the user token's `client_id` is in the Gateway's `allowedClients`.

---

### Step 3 — First Runtime Invoke (Consent Check)

**Goal:** Verify the runtime correctly handles the initial OAuth consent flow.

```python
result1 = demo.invoke_runtime(
    prompt="Summarize incident response from this document in 6 bullets and include source.",
    max_steps=5,
    max_doc_calls=1,
)
demo.print_runtime_result("FIRST INVOKE", result1)

assert "app_version" in result1, "Missing app_version"
assert "answer_mode" in result1, "Missing answer_mode"
assert "consent_required" in result1, "Missing consent_required"

is_consent = result1["consent_required"] is True
is_answer = result1["answer_mode"] in {"deterministic_extractive", "empty"}
assert is_consent or is_answer, f"Unexpected first invoke result: {result1}"
print("✅ Step 3 PASSED — first invoke returned:", result1["answer_mode"])
```

**Expected outcomes (both are valid):**

- **Consent path** (`consent_required=True`): OAuth has not been granted yet. `authorization_url` and `oauth_session_uri` will be populated. Open the `authorization_url` in a browser and complete Google consent, then proceed to Step 4.
- **Already-consented path** (`consent_required=False`): OAuth was previously granted. `answer_mode` will be `deterministic_extractive`. Skip to Step 5.

---

### Step 4 — Complete OAuth Consent (if Step 3 returned consent)

**Goal:** Register the user's consent with AgentCore so the next invoke can retrieve the document.

```python
# Only run this step if Step 3 returned consent_required=True
import webbrowser

auth_url = result1.get("authorization_url", "")
session_uri = result1.get("oauth_session_uri", "")

print("Open this URL in your browser and approve Google access:")
print(auth_url)
webbrowser.open(auth_url)

# After completing consent in the browser:
demo.complete_runtime_consent(session_uri)
print("✅ Step 4 PASSED — consent registered")
```

**Expected:** No exception from `complete_runtime_consent`. The `sessionUri` is now linked to the user's Google token.

**If it fails:** Ensure `oauth_session_uri` is a `urn:ietf:params:oauth:request_uri:...` string. Check that the Google OAuth app's redirect URI includes the AgentCore `callbackUrl`.

---

### Step 5 — Second Runtime Invoke (Document Answer)

**Goal:** Verify the agent fetches the Google Doc and returns a structured answer with sources.

```python
result2 = demo.invoke_runtime(
    prompt="Answer in 6 bullets: summarize incident response from the document and cite source link from the document.",
    max_steps=5,
    max_doc_calls=1,
)
demo.print_runtime_result("SECOND INVOKE", result2)

assert result2["consent_required"] is False, "Consent still required on second invoke"
assert result2["answer_mode"] == "deterministic_extractive", f"Unexpected mode: {result2['answer_mode']}"
assert result2["answer"]["bullets"], "No bullets in answer"
assert result2["answer"]["sources"], "No sources in answer"
assert "docs.google.com" in result2["answer"]["sources"][0], "Source URL not from Google Docs"

trace = result2.get("tool_trace", [])
events = [row["event"] for row in trace]
assert "tool_call" in events, "No tool_call in trace"
assert "tool_result" in events, "No tool_result in trace"

print("✅ Step 5 PASSED")
print("Sources:", result2["answer"]["sources"])
```

**Expected:** `consent_required=False`, `answer_mode=deterministic_extractive`, non-empty `bullets` list, `sources` containing a `docs.google.com` URL, `tool_trace` with ordered `tool_call → tool_result`.

---

### Step 6 — Observability Verification

**Goal:** Confirm observability fields are present and populated in both invocations.

```python
REQUIRED_KEYS = {
    "app_version", "response", "answer", "tool_trace", "tools_used",
    "tool_call_counts", "tool_call_limits", "answer_mode", "consent_required", "thread_id"
}

for label, result in [("FIRST INVOKE", result1), ("SECOND INVOKE", result2)]:
    missing = REQUIRED_KEYS - result.keys()
    assert not missing, f"{label} missing observability keys: {missing}"
    assert result["app_version"], f"{label}: app_version is empty"
    print(f"✅ {label} observability PASSED — app_version: {result['app_version']}")
```

**Expected:** No missing keys in either invocation, `app_version` is a non-empty string.

---

### Step 7 — Cleanup

**Goal:** Remove all created AWS resources to avoid ongoing costs.

```python
# Run only when you intend to fully tear down
demo.cleanup()
print("✅ Cleanup complete")
```

Or via notebook (Step 6 cell — uncomment `cleanup_all()`).

Resources deleted in order:
1. AgentCore Runtime (via `agentcore destroy`)
2. Gateway Targets
3. Gateway
4. OAuth Credential Provider
5. Cognito User Pool

**Verification:** After cleanup, confirm no resources remain:

```bash
agentcore status --agent <runtime_agent_name>   # should return "not found"
aws bedrock-agentcore list-gateways --region $AWS_REGION  # should not include workshop gateway
aws cognito-idp list-user-pools --max-results 60 --region $AWS_REGION  # should not include workshop pool
```

---

## Part 3 — Datasets for Testing

The system takes a Google Doc ID and a natural language prompt as its primary inputs. Dataset variation is achieved by changing one or both of these dimensions.

### Dataset Type 1 — Standard Structured Document (Happy Path)

**Description:** A document with clear sections, headings, and factual content that maps directly to the prompt.

**Example documents:**
- Incident response runbook
- IT policy document
- Meeting notes with action items
- Technical specification

**Example prompt:**
```
Summarize incident response from this document in 6 bullets and include source.
```

**Expected results:**
- `answer_mode`: `deterministic_extractive`
- `answer.kind`: `bullet_summary`
- `answer.bullets`: 3–6 non-empty strings, each grounded in the document text
- `answer.sources`: one URL of the form `https://docs.google.com/document/d/<doc_id>/edit`
- `consent_required`: `False`
- `tool_trace`: `tool_call → tool_result` for `get_google_doc`

**Validation criteria:** Each bullet must contain words that appear verbatim in the source document. The source URL must match `GOOGLE_DOC_ID`.

---

### Dataset Type 2 — Empty Document

**Description:** A Google Doc that exists but has no text content (newly created or cleared).

**How to use:**
```python
# Set GOOGLE_DOC_ID to the ID of an empty document
os.environ["GOOGLE_DOC_ID"] = "<empty_doc_id>"
```

**Example prompt:**
```
Summarize the key points from this document.
```

**Expected results:**
- `answer_mode`: `empty` (or `tool_only`)
- `answer.kind`: `empty`
- `answer.bullets`: `[]` (empty list)
- `answer.sources`: contains the document URL
- `response`: contains `"The document is empty"`
- `consent_required`: `False`

**Validation criteria:** The agent must not fabricate content. Bullets must be empty. The response must explicitly state the document is empty.

---

### Dataset Type 3 — Off-Topic Prompt (Relevance Test)

**Description:** A real document (e.g. a photography article) combined with a prompt that asks about a completely different topic.

**Example document:** Any Google Doc about topic A (e.g. street photography history).

**Example prompt:**
```
Summarize Kubernetes autoscaling best practices from this document.
```

**Expected results:**
- `answer_mode`: `deterministic_extractive`
- `answer.kind`: `not_found`
- `answer.bullets`: `[]`
- `response`: contains "Not found in document" or equivalent
- `consent_required`: `False`

**Validation criteria:** The agent must not hallucinate bullets about Kubernetes. The `not_found` kind is the correct degraded response for a mismatched prompt/document pair.

---

### Dataset Type 4 — Large Document (Context Truncation)

**Description:** A Google Doc that exceeds `DOC_CONTEXT_MAX_CHARS` (default: 12,000 characters). The agent truncates at this limit before building the structured answer.

**How to use:** Use a doc with > 12,000 characters of body text. Monitor whether the agent still returns valid bullets.

**Example prompt:**
```
List the main sections covered in this document and include the source.
```

**Expected results:**
- `answer_mode`: `deterministic_extractive`
- `answer.kind`: `bullet_summary`
- `answer.bullets`: reflects content from the **first** ~12,000 characters only
- Content from the end of the document may not appear in bullets — this is expected behaviour, not a bug

**Validation criteria:** Bullets come from content in the document's opening sections. No error is raised. `tool_call_counts.get_google_doc = 1`.

---

### Dataset Type 5 — Fresh User (Consent Flow)

**Description:** A user who has never consented to Google Docs access, or a forced re-authentication scenario.

**How to trigger:**
```python
result = demo.invoke_runtime(
    prompt="Summarize this document.",
    # include force_authentication in the payload:
)
# Or use build_runtime_payload with force_authentication=True
payload = demo.build_runtime_payload(
    prompt="Summarize this document.",
    force_authentication=True,  # forces fresh consent regardless of existing token
)
result = demo.invoke_runtime(payload=payload)
```

**Expected results (first invoke):**
- `consent_required`: `True`
- `authorization_url`: non-empty HTTPS URL containing `bedrock-agentcore` and `request_uri=`
- `oauth_session_uri`: starts with `urn:ietf:params:oauth:request_uri:`
- `answer.bullets`: `[]`

**Expected results (second invoke, after consent):**
- `consent_required`: `False`
- `answer_mode`: `deterministic_extractive`
- Bullets and sources populated normally

**Validation criteria:** The `authorization_url` must be openable in a browser and show Google's OAuth consent screen. After consent and `complete_resource_token_auth`, the second invoke must return a document answer.

---

### Dataset Type 6 — Negative Auth (Invalid Token)

**Description:** Test what happens when the inbound JWT is missing, expired, or from the wrong Cognito client.

**How to trigger:**
```python
import requests

# No token at all
resp = requests.post(
    runtime_url,
    headers={"Content-Type": "application/json"},
    json={"prompt": "test", "doc_id": "test", "thread_id": "m11-test-0000000000000000000000001"},
    timeout=(20, 30),
)
print("No token → HTTP", resp.status_code)  # Expected: 401

# Expired / garbage token
resp = requests.post(
    runtime_url,
    headers={"Authorization": "Bearer garbage.token.here", "Content-Type": "application/json"},
    json={"prompt": "test", "doc_id": "test", "thread_id": "m11-test-0000000000000000000000001"},
    timeout=(20, 30),
)
print("Bad token → HTTP", resp.status_code)  # Expected: 401
```

**Expected results:**
- HTTP `401` for missing or invalid token
- HTTP `403` for valid token from wrong Cognito client (not in `allowedClients`)
- No agent logic executed, no CloudWatch log entry for the invocation body

---

## Part 4 — Error Interpretation Guide

### 4.1 Auth Errors

| Symptom | Likely cause | Fix |
|---|---|---|
| HTTP 401 `"Token has expired"` | Cognito JWT expired (1-hour lifetime) | Re-run `get_user_access_token()` — `invoke_runtime` does this automatically on first 401 |
| HTTP 401 `"Unauthorized"` | Token missing or malformed | Ensure `Authorization: Bearer <token>` header is present and the token is a valid JWT |
| HTTP 403 `"client_id not in allowedClients"` | Cognito App Client not registered in Gateway authorizer | Add the `user_client_id` to the Gateway's `allowedClients` config |
| HTTP 403 with USER_FEDERATION error | Token is a Machine-to-Machine (client_credentials) token, not a user token | Use `USER_PASSWORD_AUTH` flow to obtain a user-context JWT, not a service token |
| `ValueError: RUNTIME_THREAD_ID must be at least 33 characters` | `thread_id` is too short | Use a UUID-based thread ID of ≥ 33 characters, e.g. `m11-runtime-react-demo-000000000000001` |

### 4.2 Consent & OAuth Errors

| Symptom | Likely cause | Fix |
|---|---|---|
| `consent_required=True` on second invoke | `complete_resource_token_auth` was not called, or was called with the wrong `session_uri` | Verify `oauth_session_uri` from first invoke result is used exactly as-is in `complete_runtime_consent()` |
| `complete_resource_token_auth` raises `AccessDeniedException` | Session URI expired or already consumed | Restart the consent flow — call `invoke_runtime` again (fresh consent is needed) |
| Authorization URL opens but shows "redirect_uri_mismatch" in Google | AgentCore `callbackUrl` not registered in Google OAuth console | Add the provider's `callback_url` to Google OAuth allowed redirect URIs (see `docs/google-oauth-setup-for-e2e.md`) |
| `oauth_session_uri` is empty in first invoke result | Consent elicitation URL was not parsed from the MCP `-32042` response | Check `GATEWAY_MCP_VERSION=2025-11-25` is set; this header is required for 3LO flows |

### 4.3 Gateway & MCP Errors

| Symptom | Likely cause | Fix |
|---|---|---|
| `RuntimeError: Gateway HTTP 403` with `USER_FEDERATION` in message | Using M2M token for a user-scoped call | Switch to a user JWT from `USER_PASSWORD_AUTH`, not `client_credentials` |
| `RuntimeError: Gateway HTTP 404` | Gateway deleted or wrong `GATEWAY_URL` | Re-run Step 2 of the notebook to recreate the Gateway; update `GATEWAY_URL` |
| `RuntimeError: MCP error -32600 Invalid Request` | Malformed JSON-RPC request | Check that `GOOGLE_DOCS_TOOL_NAME` matches the actual tool name from `tools/list` |
| `ValidationException` on `tools/call` | `MCP-Protocol-Version` header missing or wrong version | Set `GATEWAY_MCP_VERSION=2025-11-25` in the runtime env vars |
| Google Docs tool not found in `tools/list` | Target not created or in `FAILED` state | Recreate the Gateway target (Step 2C of the notebook) |

### 4.4 Runtime & Document Errors

| Symptom | Likely cause | Fix |
|---|---|---|
| `answer_mode: error` with `"ERROR: user_access_token is empty"` | `user_access_token` field missing from payload | Always include `user_access_token` in the invoke payload |
| `answer_mode: error` with `"ERROR: doc_id is empty"` | `doc_id` missing or empty in payload | Set `GOOGLE_DOC_ID` in `.env` and include `doc_id` in the payload |
| `answer_mode: empty`, `answer.kind: empty` | Document exists but has no text content | Expected behaviour for empty docs — not an error |
| `answer_mode: deterministic_extractive`, bullets look truncated | Document exceeds 12,000 char context limit | Expected — content beyond `DOC_CONTEXT_MAX_CHARS` is not processed. Increase `DOC_CONTEXT_MAX_CHARS` env var if needed |
| `RuntimeError: Stale runtime detected: app_version=X, expected=Y` | Deployed runtime is out of date | Re-run Step 4 deploy in the notebook |
| `ConflictException: while it's CREATING` on deploy | Previous deploy still in progress | Wait 30 seconds and retry the deploy command |
| Timeout on runtime invoke (`ReadTimeout`) | Runtime cold start or heavy document | Increase the `read_timeout_sec` parameter (default: 90 s); retry once automatically |

### 4.5 Quick Diagnostic Checklist

When a test fails and the cause is not obvious, run through this list:

```
□ 1. aws sts get-caller-identity returns the correct account?
□ 2. agentcore status shows ACTIVE for the runtime?
□ 3. GOOGLE_DOC_ID is set and the document exists / is not trashed?
□ 4. GATEWAY_URL and GOOGLE_DOCS_TOOL_NAME are set in runtime env vars?
□ 5. The Cognito user_client_id is in the Gateway allowedClients list?
□ 6. app_version in the response matches the source file version string?
□ 7. MCP-Protocol-Version header is 2025-11-25?
□ 8. The AgentCore callbackUrl is registered in Google OAuth redirect URIs?
□ 9. No stale AWS static credentials (AWS_ACCESS_KEY_ID etc.) override the profile?
□ 10. thread_id is >= 33 characters?
```

---

## Part 5 — Running the Full Test Suite

### Unit tests (no AWS required)

```bash
pytest tests/test_e2e_agentcore.py -v -m "not integration"
```

All 24 test cases from Level 1 run without any AWS calls. Expected output: all green.

### Integration smoke (real AWS deployment)

```bash
# Ensure .env is populated, runtime is ACTIVE
set -a && source .env && set +a
pytest tests/test_e2e_agentcore.py -v -m integration
```

Runs `TC-INT-01` through `TC-INT-03` against the live deployed runtime. Expected: all green, `app_version` matches, first invoke returns consent or document answer.

### Full E2E script

```bash
python scripts/run_agentcore_e2e_smoke.py
# or with options:
python scripts/run_agentcore_e2e_smoke.py --skip-deploy --timeout 180
```

This runs the complete consent + document answer flow end-to-end and prints a summary JSON. Use `--no-browser` in CI environments.

---

## Part 6 — Definition of Done Checklist

Use this checklist to verify that a deployment is production-ready before sign-off:

```
Level 1 — Test Cases
□ All 24 test cases from TEST_CASES.md written and reviewed
□ At least one negative auth test case (TC-AUTH-03 or TC-AUTH-06)
□ Consent path covered (TC-CS-01 through TC-CS-05)
□ Fallback covered (TC-FB-01 through TC-FB-07)

Level 2 — Testing Documentation
□ This guide is readable and reproducible from a clean environment
□ .env.example contains all required variables without real secrets
□ All 6 dataset types documented with expected results
□ Error interpretation table covers the most common failure modes

Level 3 — Deployed E2E Evidence (see EVIDENCE.md)
□ First invoke output captured (consent or document answer)
□ Second invoke output captured (deterministic_extractive + sources + tool_trace)
□ Both invocations show all required observability keys
□ app_version matches source file version string
□ Cleanup executed and resource deletion confirmed
```