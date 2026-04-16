# Test Cases: AgentCore E2E Flow

**Architecture under test:**
- AgentCore Runtime (`BedrockAgentCoreApp` / `@app.entrypoint`)
- Inbound Auth (Cognito JWT via `customJWTAuthorizer`)
- Gateway (MCP `2025-11-25` + `tools/call`)
- Outbound OAuth to Google Docs (3-Legged OAuth via AgentCore Identity)
- Observability (`tool_trace`, `answer_mode`, `app_version` in every response)

---

## Group AUTH — Inbound Authentication

---

### TC-AUTH-01 — Positive: Valid Cognito JWT reaches the runtime

| Field | Value |
|---|---|
| **ID** | TC-AUTH-01 |
| **Group** | AUTH |
| **Priority** | P0 |
| **Type** | Positive |

**Preconditions:**
- Cognito User Pool and App Client exist (created via `ensure_inbound_auth`)
- Demo user exists with permanent password
- Runtime is deployed and `ACTIVE`

**Steps:**
1. Call `cognito.initiate_auth` with `USER_PASSWORD_AUTH` and valid credentials
2. Capture the returned `AccessToken`
3. `POST` to the Runtime invocation URL with `Authorization: Bearer <token>`, valid `doc_id`, `thread_id` ≥ 33 chars, and a non-empty `prompt`

**Expected result:**
- HTTP `200`
- Response body is a JSON object
- `answer_mode` is `deterministic_extractive` or `consent` (depending on OAuth state)
- No `ERROR` prefix in `response`
- `app_version` matches the deployed version string from `runtime_app_agentcore_full.py`

---

### TC-AUTH-02 — Positive: All required observability keys are present

| Field | Value |
|---|---|
| **ID** | TC-AUTH-02 |
| **Group** | AUTH |
| **Priority** | P0 |
| **Type** | Positive |

**Preconditions:**  Same as TC-AUTH-01

**Steps:**
1. Perform a valid authenticated invoke (same as TC-AUTH-01 steps 1–3)
2. Inspect the JSON response keys

**Expected result:**
- Response contains all of: `app_version`, `response`, `answer`, `tool_trace`, `tools_used`, `tool_call_counts`, `tool_call_limits`, `answer_mode`, `consent_required`, `thread_id`
- `thread_id` in the response matches the `thread_id` sent in the request

---

### TC-AUTH-03 — Negative: Missing `Authorization` header returns 401

| Field | Value |
|---|---|
| **ID** | TC-AUTH-03 |
| **Group** | AUTH |
| **Priority** | P0 |
| **Type** | Negative |

**Preconditions:** Runtime is deployed and `ACTIVE`

**Steps:**
1. `POST` to the Runtime invocation URL **without** any `Authorization` header
2. Include a valid JSON body (`doc_id`, `prompt`, `thread_id`)

**Expected result:**
- HTTP `401` from AgentCore Runtime
- Agent logic is **not** executed (no tool calls, no CloudWatch log entry for this request)

---

### TC-AUTH-04 — Negative: Expired JWT returns 401 and triggers token refresh

| Field | Value |
|---|---|
| **ID** | TC-AUTH-04 |
| **Group** | AUTH |
| **Priority** | P0 |
| **Type** | Negative |

**Preconditions:** Runtime deployed; a previously valid token has expired (or simulate with a tampered token)

**Steps:**
1. Attempt to invoke runtime with an expired/invalid `Bearer` token
2. Observe the `401` response with body containing `"Token has expired"`
3. Call `cognito.initiate_auth` again to obtain a fresh token
4. Retry the same request with the fresh token

**Expected result:**
- First attempt → HTTP `401`
- Second attempt (fresh token) → HTTP `200` with a valid response body
- The `demo_runtime` helper (`invoke_runtime`) auto-retries this flow transparently

---

### TC-AUTH-05 — Negative: Token from wrong Cognito client is rejected

| Field | Value |
|---|---|
| **ID** | TC-AUTH-05 |
| **Group** | AUTH |
| **Priority** | P1 |
| **Type** | Negative |

**Preconditions:** A second Cognito App Client exists whose `ClientId` is **not** listed in the Gateway/Runtime `allowedClients`

**Steps:**
1. Obtain a valid JWT from the **wrong** App Client
2. `POST` to the Runtime invocation URL with this token

**Expected result:**
- HTTP `401` or `403`
- Body indicates auth failure (e.g., `"client_id not in allowedClients"` or equivalent)
- Agent logic is not executed

---

### TC-AUTH-06 — Negative: Empty or missing `user_access_token` in payload returns error response

| Field | Value |
|---|---|
| **ID** | TC-AUTH-06 |
| **Group** | AUTH |
| **Priority** | P0 |
| **Type** | Negative |

**Preconditions:** Runtime deployed

**Steps:**
1. Call `invoke()` with a valid `doc_id` and `prompt` but `user_access_token` set to `""` (or omitted entirely)

**Expected result:**
- Response is a dict with `answer_mode = "error"`
- `response` field starts with `"ERROR: user_access_token is empty"`
- No MCP/Gateway call is made
- `consent_required` is `False`

---

### TC-AUTH-07 — Negative: `thread_id` shorter than 33 chars is rejected before HTTP call

| Field | Value |
|---|---|
| **ID** | TC-AUTH-07 |
| **Group** | AUTH |
| **Priority** | P1 |
| **Type** | Negative |

**Preconditions:** None (pure validation)

**Steps:**
1. Call `demo.build_runtime_payload(thread_id="short-id")` where `len("short-id") < 33`

**Expected result:**
- `ValueError` is raised immediately
- Message includes `"RUNTIME_THREAD_ID must be at least 33 characters"`
- No HTTP request is sent

---

## Group RT — Runtime Invocation & Tool-Calling

---

### TC-RT-01 — Runtime returns a valid structured response for a document query

| Field | Value |
|---|---|
| **ID** | TC-RT-01 |
| **Group** | RT |
| **Priority** | P0 |
| **Type** | Positive |

**Preconditions:**
- Runtime deployed and `ACTIVE`
- Google OAuth consent already granted for this user
- `GOOGLE_DOC_ID` points to a non-empty document

**Steps:**
1. Invoke runtime with: `prompt = "Summarize incident response in 6 bullets and include source."`, valid `doc_id`, valid `thread_id`, valid `user_access_token`

**Expected result:**
- `answer_mode = "deterministic_extractive"`
- `answer.kind = "bullet_summary"`
- `answer.bullets` — non-empty list (≥ 1 item)
- `answer.sources` — contains the Google Docs URL for the document
- `response` string contains `"Sources:"` section
- `consent_required = False`

---

### TC-RT-02 — `tool_trace` contains ordered `tool_call` → `tool_result` for `get_google_doc`

| Field | Value |
|---|---|
| **ID** | TC-RT-02 |
| **Group** | RT |
| **Priority** | P0 |
| **Type** | Positive |

**Preconditions:** Same as TC-RT-01

**Steps:**
1. Perform a successful invoke (same as TC-RT-01)
2. Extract `tool_trace` from the response

**Expected result:**
- `tool_trace` has at least 2 entries
- Entry at lower index has `event = "tool_call"`, `tool = "get_google_doc"`
- Entry at higher index has `event = "tool_result"`, `tool = "get_google_doc"`
- `tools_used` list contains `"get_google_doc"`
- `tool_call_counts.get_google_doc == 1`

---

### TC-RT-03 — `MCP-Protocol-Version: 2025-11-25` header is sent on every Gateway call

| Field | Value |
|---|---|
| **ID** | TC-RT-03 |
| **Group** | RT |
| **Priority** | P0 |
| **Type** | Positive |

**Preconditions:** Gateway deployed with `mcpVersion: 2025-11-25`

**Steps:**
1. Enable HTTP-level request capture (e.g., via proxy or SDK interceptor)
2. Perform any runtime invoke that triggers a `tools/call` to the Gateway
3. Inspect outgoing headers on the MCP POST request

**Expected result:**
- Header `MCP-Protocol-Version: 2025-11-25` is present on every request
- Absence of this header would cause a `ValidationException` in 3LO flows

---

### TC-RT-04 — `max_doc_calls` budget prevents extra tool calls

| Field | Value |
|---|---|
| **ID** | TC-RT-04 |
| **Group** | RT |
| **Priority** | P1 |
| **Type** | Positive |

**Preconditions:** Runtime deployed

**Steps:**
1. Invoke runtime with `max_doc_calls = 1`
2. Inspect `tool_call_counts` in the response

**Expected result:**
- `tool_call_counts.get_google_doc ≤ 1`
- `tool_call_limits.get_google_doc = 1`
- If a second call were attempted, the cached result is returned instead

---

### TC-RT-05 — `app_version` in response matches deployed source file

| Field | Value |
|---|---|
| **ID** | TC-RT-05 |
| **Group** | RT |
| **Priority** | P0 |
| **Type** | Positive |

**Preconditions:** Runtime deployed from a known commit

**Steps:**
1. Read `APP_VERSION` string from `runtime_app_agentcore_full.py`
2. Perform any valid invoke
3. Compare `response["app_version"]` with the value read in step 1

**Expected result:**
- Both values are identical
- A mismatch indicates a stale deployment (red flag for the mentor checklist)

---

## Group CS — Consent / OAuth Path

---

### TC-CS-01 — First invoke for a new user returns `consent_required = True`

| Field | Value |
|---|---|
| **ID** | TC-CS-01 |
| **Group** | CS |
| **Priority** | P0 |
| **Type** | Positive |

**Preconditions:**
- Runtime deployed
- Google OAuth consent has **never** been granted for this user (fresh user or `force_authentication = True`)

**Steps:**
1. Invoke runtime with a valid JWT, `doc_id`, `prompt`, `thread_id`
2. Inspect the response

**Expected result:**
- `consent_required = True`
- `authorization_url` is a non-empty HTTPS URL containing `bedrock-agentcore` and `request_uri=`
- `oauth_session_uri` starts with `urn:ietf:params:oauth:request_uri:`
- `answer_mode` is not `"deterministic_extractive"` (agent did not produce a document answer)

---

### TC-CS-02 — `authorization_url` is correctly constructed from `request_uri`

| Field | Value |
|---|---|
| **ID** | TC-CS-02 |
| **Group** | CS |
| **Priority** | P0 |
| **Type** | Positive |

**Preconditions:** TC-CS-01 executed; `oauth_session_uri` captured from its response

**Steps:**
1. Take the `oauth_session_uri` (a `urn:ietf:params:oauth:request_uri:…` URN) from TC-CS-01
2. Call `build_authorization_url(oauth_session_uri)`
3. Inspect the result

**Expected result:**
- URL contains `https://bedrock-agentcore.<region>.amazonaws.com/identities/oauth2/authorize`
- Query parameter `request_uri` is percent-encoded (`:` characters escaped as `%3A`)
- Opening this URL in a browser shows the Google OAuth consent screen

---

### TC-CS-03 — After consent, `complete_resource_token_auth` is called with the correct session URI

| Field | Value |
|---|---|
| **ID** | TC-CS-03 |
| **Group** | CS |
| **Priority** | P0 |
| **Type** | Positive |

**Preconditions:**
- TC-CS-01 completed; user has clicked through the consent screen
- `oauth_session_uri` captured from TC-CS-01 response

**Steps:**
1. Call `complete_resource_token_auth` (via `demo.complete_runtime_consent(session_uri)`) with the captured URN and the user's access token
2. Perform a second invoke using the **same** `thread_id` and the same `oauth_session_uri` in the payload

**Expected result:**
- `complete_resource_token_auth` call succeeds without error
- Second invoke returns `consent_required = False`
- Second invoke returns `answer_mode = "deterministic_extractive"`
- `answer.sources` contains the Google Docs URL

---

### TC-CS-04 — MCP error code `-32042` is treated as a consent challenge, not an error

| Field | Value |
|---|---|
| **ID** | TC-CS-04 |
| **Group** | CS |
| **Priority** | P0 |
| **Type** | Positive |

**Preconditions:** Gateway returns `{"error": {"code": -32042, …}}` for a `tools/call` request

**Steps:**
1. Invoke the runtime with a user who has not consented
2. Inspect the raw MCP payload returned by `mcp_request()`
3. Inspect the final `invoke()` response

**Expected result:**
- `mcp_request()` returns the error payload as a dict (does **not** raise `RuntimeError`)
- `invoke()` detects `error.code == -32042`, extracts the `elicitations[0].url`, and populates `authorization_url` and `oauth_session_uri`
- Final response: `consent_required = True`, `answer_mode` ≠ `"error"`

---

### TC-CS-05 — Second invoke with pre-granted consent returns document answer

| Field | Value |
|---|---|
| **ID** | TC-CS-05 |
| **Group** | CS |
| **Priority** | P0 |
| **Type** | Positive |

**Preconditions:** Google OAuth consent was granted previously; `oauth_session_uri` from the first invoke has been registered via `complete_resource_token_auth`

**Steps:**
1. Invoke runtime with `prompt = "Answer in 6 bullets: summarize incident response and cite source link"`, `oauth_session_uri` included in payload
2. Inspect the response

**Expected result:**
- HTTP `200`
- `consent_required = False`
- `answer_mode = "deterministic_extractive"`
- `answer.bullets` non-empty
- `answer.sources` contains the Google Docs URL
- `tool_trace` shows `tool_call` → `tool_result` for `get_google_doc`

---

## Group FB — Failure & Fallback Behaviour

---

### TC-FB-01 — Missing `GATEWAY_URL` env var prevents startup

| Field | Value |
|---|---|
| **ID** | TC-FB-01 |
| **Group** | FB |
| **Priority** | P0 |
| **Type** | Negative |

**Preconditions:** `GATEWAY_URL` is not set in the runtime environment

**Steps:**
1. Call `get_settings()` without `GATEWAY_URL` in the environment

**Expected result:**
- `RuntimeError` or `KeyError` is raised immediately
- No network calls are made
- Error message references the missing variable

---

### TC-FB-02 — Missing `GOOGLE_API_KEY` env var prevents startup

| Field | Value |
|---|---|
| **ID** | TC-FB-02 |
| **Group** | FB |
| **Priority** | P0 |
| **Type** | Negative |

**Preconditions:** `GOOGLE_API_KEY` is not set in the runtime environment

**Steps:**
1. Call `get_settings()` without `GOOGLE_API_KEY` in the environment

**Expected result:**
- `RuntimeError` is raised with message `"Missing GOOGLE_API_KEY environment variable"`
- No network calls are made

---

### TC-FB-03 — Gateway network failure surfaces as `answer_mode = "error"`

| Field | Value |
|---|---|
| **ID** | TC-FB-03 |
| **Group** | FB |
| **Priority** | P0 |
| **Type** | Negative |

**Preconditions:** Runtime deployed; Gateway is unreachable (simulate with an invalid `GATEWAY_URL` or by blocking the endpoint)

**Steps:**
1. Invoke runtime with valid auth and a valid `doc_id`
2. Gateway connection fails (e.g., `ConnectionError` or timeout)

**Expected result:**
- `invoke()` does **not** raise an unhandled exception
- Response is a dict with `answer_mode = "error"`
- `response` field starts with `"ERROR: MCP network failure"` or similar
- `consent_required = False`

---

### TC-FB-04 — HTTP `403` from Gateway propagates as `RuntimeError`

| Field | Value |
|---|---|
| **ID** | TC-FB-04 |
| **Group** | FB |
| **Priority** | P1 |
| **Type** | Negative |

**Preconditions:** Gateway returns HTTP `403` (e.g., wrong scope or client not in `allowedClients`)

**Steps:**
1. Call `mcp_request()` with a token that has an invalid scope for the Gateway
2. Observe the exception raised by `mcp_request()`

**Expected result:**
- `RuntimeError` is raised containing `"Gateway HTTP 403"` and the response body preview
- The error is not silently swallowed

---

### TC-FB-05 — Empty Google Doc returns `answer.kind = "empty"`

| Field | Value |
|---|---|
| **ID** | TC-FB-05 |
| **Group** | FB |
| **Priority** | P1 |
| **Type** | Negative |

**Preconditions:** `GOOGLE_DOC_ID` points to a document with no content

**Steps:**
1. Invoke runtime with a prompt against the empty document

**Expected result:**
- `answer.kind = "empty"`
- `answer.bullets` is an empty list
- `answer.sources` contains the document URL
- `response` contains `"The document is empty"`
- `consent_required = False`

---

### TC-FB-06 — `invoke()` always returns a dict, never raises unhandled exceptions

| Field | Value |
|---|---|
| **ID** | TC-FB-06 |
| **Group** | FB |
| **Priority** | P0 |
| **Type** | Negative |

**Preconditions:** None

**Steps:**
1. Call `invoke({})` — empty payload
2. Call `invoke({"prompt": None, "doc_id": None, "user_access_token": ""})` — null fields
3. Call `invoke({"prompt": "ok", "doc_id": "", "user_access_token": "x", "thread_id": "m11-00000000000000000000000000000001"})` — empty `doc_id`

**Expected result:**
- All three calls return a `dict` (no unhandled exception escapes `invoke()`)
- Each dict has `answer_mode` set to `"error"` or equivalent degraded state
- Callers can safely inspect `response`, `answer_mode`, and `consent_required` in all cases

---

### TC-FB-07 — Generic MCP error (code ≠ -32042) is raised as `RuntimeError`

| Field | Value |
|---|---|
| **ID** | TC-FB-07 |
| **Group** | FB |
| **Priority** | P1 |
| **Type** | Negative |

**Preconditions:** Gateway returns a JSON-RPC error with a code other than `-32042`

**Steps:**
1. Trigger a `tools/call` where the Gateway returns `{"error": {"code": -32600, "message": "Invalid Request"}}`
2. Observe the behaviour of `mcp_request()`

**Expected result:**
- `RuntimeError` is raised with message containing `"MCP error"`
- This error propagates up to `get_google_doc()`, which returns `"ERROR: …"` string
- `invoke()` ultimately sets `answer_mode = "error"`

---

## Summary Table

| ID | Group | Type | Priority | Scenario |
|---|---|---|---|---|
| TC-AUTH-01 | AUTH | Positive | P0 | Valid JWT reaches runtime, gets HTTP 200 |
| TC-AUTH-02 | AUTH | Positive | P0 | All observability keys present in response |
| TC-AUTH-03 | AUTH | Negative | P0 | No `Authorization` header → HTTP 401 |
| TC-AUTH-04 | AUTH | Negative | P0 | Expired JWT → 401 → token refresh → 200 |
| TC-AUTH-05 | AUTH | Negative | P1 | JWT from wrong client → 401/403 |
| TC-AUTH-06 | AUTH | Negative | P0 | Empty `user_access_token` → error response |
| TC-AUTH-07 | AUTH | Negative | P1 | `thread_id` < 33 chars → `ValueError` |
| TC-RT-01 | RT | Positive | P0 | Valid invoke → bullets + source URL |
| TC-RT-02 | RT | Positive | P0 | `tool_trace` has ordered call → result |
| TC-RT-03 | RT | Positive | P0 | `MCP-Protocol-Version: 2025-11-25` header sent |
| TC-RT-04 | RT | Positive | P1 | `max_doc_calls=1` budget respected |
| TC-RT-05 | RT | Positive | P0 | `app_version` matches deployed source |
| TC-CS-01 | CS | Positive | P0 | First invoke → `consent_required=True` + URLs |
| TC-CS-02 | CS | Positive | P0 | `authorization_url` correctly percent-encoded |
| TC-CS-03 | CS | Positive | P0 | After consent → `complete_resource_token_auth` called |
| TC-CS-04 | CS | Positive | P0 | MCP `-32042` → consent path, not error |
| TC-CS-05 | CS | Positive | P0 | Second invoke with granted consent → document answer |
| TC-FB-01 | FB | Negative | P0 | Missing `GATEWAY_URL` → startup error |
| TC-FB-02 | FB | Negative | P0 | Missing `GOOGLE_API_KEY` → startup error |
| TC-FB-03 | FB | Negative | P0 | Gateway network failure → error response dict |
| TC-FB-04 | FB | Negative | P1 | HTTP 403 from Gateway → `RuntimeError` |
| TC-FB-05 | FB | Negative | P1 | Empty document → `kind="empty"` |
| TC-FB-06 | FB | Negative | P0 | `invoke()` never throws — always returns dict |
| TC-FB-07 | FB | Negative | P1 | Generic MCP error → `RuntimeError` → error response |