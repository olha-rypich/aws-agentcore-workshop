# Production Deployment & Testing

**Date:** 2026-04-16  
**AWS Account:** 951913066143  
**Region:** us-east-1  
**Workshop Prefix:** acwslite  

---

## 1. Deployed Resources

All components deployed and verified READY before testing:

| Component | Resource | Value |
|---|---|---|
| AgentCore Runtime | ARN | `arn:aws:bedrock-agentcore:us-east-1:951913066143:runtime/acwslite_runtime_agent-caG2iY57j3` |
| AgentCore Runtime | Status | `READY` |
| AgentCore Gateway | ID | `acwslite-gateway-vefdk5ygab` |
| AgentCore Gateway | URL | `https://acwslite-gateway-vefdk5ygab.gateway.bedrock-agentcore.us-east-1.amazonaws.com/mcp` |
| Google Docs Target | Tool name | `acwslite-google-docs-target___getDocument` |
| Cognito User Pool | ID | `us-east-1_jOH5jzPsr` |
| Cognito Discovery URL | — | `https://cognito-idp.us-east-1.amazonaws.com/us-east-1_jOH5jzPsr/.well-known/openid-configuration` |
| OAuth Provider | Name | `acwslite_google_provider` |
| OAuth Provider | ARN | `arn:aws:bedrock-agentcore:us-east-1:951913066143:token-vault/default/oauth2credentialprovider/acwslite_google_provider` |

### Runtime entrypoint confirmation

The runtime was deployed using the canonical AgentCore pattern:

```python
from bedrock_agentcore.runtime import BedrockAgentCoreApp

app = BedrockAgentCoreApp()

@app.entrypoint
def invoke(payload: dict, context=None):
    ...

if __name__ == "__main__":
    app.run()
```

Deployed via CLI:
```
agentcore configure --name acwslite_runtime_agent \
  --entrypoint runtime_app_agentcore_full.py \
  --deployment-type direct_code_deploy \
  --runtime PYTHON_3_12 \
  --authorizer-config '{"customJWTAuthorizer": {...}}'

agentcore deploy --agent acwslite_runtime_agent \
  --env GATEWAY_URL=... \
  --env GOOGLE_DOCS_TOOL_NAME=... \
  --env GOOGLE_API_KEY=...
```

---

## 2. First Invoke — Consent Challenge

**Purpose:** Verify that an unauthenticated user receives a proper OAuth consent challenge.  
**Session ID:** `m11-runtime-react-demo-000000000000001`  
**Request ID:** `3ce6b31b-d90f-4403-9268-c2ee272c2d2d`  
**Timestamp:** `2026-04-16T11:31:51Z`

```
HTTP status: 200

=== FIRST INVOKE ===
app_version: 2026-04-16-debug-v1
recursion_limit: 5
consent_required: True
tools_used: ['get_google_doc']
tool_call_counts: {'get_google_doc': 0}
tool_call_limits: {'get_google_doc': 1}
response:
 Google consent required.
authorization_url: https://bedrock-agentcore.us-east-1.amazonaws.com/identities/oauth2/authorize?request_uri=urn%3Aietf%3Aparams%3Aoauth%3Arequest_uri%3ANWQ3YTc3M2ItMmRiYy00YWJjLTlhMWYtMmVlZjdiZjRmOTI1
oauth_session_uri: urn:ietf:params:oauth:request_uri:NWQ3YTc3M2ItMmRiYy00YWJjLTlhMWYtMmVlZjdiZjRmOTI1
Complete consent in browser, then re-run with the same oauth_session_uri.

Tool trace:
- step=1 event=tool_call tool=get_google_doc
- step=2 event=tool_result tool=get_google_doc
```

**Result:** ✅ Consent challenge returned correctly. User opened `authorization_url` in browser and granted Google Docs access.

---

## 3. Second Invoke — Document Answer

**Purpose:** Verify that after consent is granted, the agent fetches the Google Doc and returns a structured answer with sources.  
**Session ID:** `m11-runtime-react-demo-000000000000001`  
**Request ID:** `2903d5c1-6037-4401-91d0-c622ffe52963`  
**Timestamp:** `2026-04-16T11:39:17Z`  
**Duration:** 2.220s

```
OAuth session completed in AgentCore token vault.
HTTP status: 200

=== SECOND INVOKE ===
app_version: 2026-04-16-debug-v1
recursion_limit: 5
consent_required: False
tools_used: ['get_google_doc']
tool_call_counts: {'get_google_doc': '1'}
tool_call_limits: {'get_google_doc': 1}
response:
 - Test Cases: AgentCore E2E Flow.
 - AgentCore Runtime (BedrockAgentCoreApp / @app.entrypoint).
 - Inbound Auth (Cognito JWT via customJWTAuthorizer).
 - Gateway (MCP 2025-11-25 + tools/call).
 - Outbound OAuth to Google Docs (3-Legged OAuth via AgentCore Identity).
 - Observability (tool_trace, answer_mode, app_version in every response).

Sources:
- https://docs.google.com/document/d/14D0iQOfoYoREFAPSbP0AYd6X3Agkh62Ge1eV75UfJYo/edit

Tool trace:
- step=1 event=tool_call tool=get_google_doc
- step=2 event=tool_result tool=get_google_doc
```

**Result:** ✅ Document retrieved via Gateway MCP. Structured answer with bullets and source link returned.

---

## 4. Observability Evidence

**Log Group:** `/aws/bedrock-agentcore/runtimes/acwslite_runtime_agent-r3kpz82S7v-DEFAULT`  
**Collected at:** `2026-04-16T12:25:32Z`

### Invocation 1 — OAuth consent challenge (requestId: `3ce6b31b`)

```
[2026-04-16T11:31:51Z] DEBUG: Gateway MCP call, doc_id=14D0iQOf..., gateway=https://acwslite-gateway-vefdk5ygab.gateway.bedroc
[2026-04-16T11:31:51Z] DEBUG: OAuth elicitation, url=https://bedrock-agentcore.us-east-1.amazonaws.com/identities/oauth2/authorize?re
[2026-04-16T11:31:51Z] {"level":"INFO","message":"Invocation completed successfully (0.728s)","requestId":"3ce6b31b-d90f-4403-9268-c2ee272c2d2d","sessionId":"m11-runtime-react-demo-000000000000001"}
```

### Invocation 2 — Document fetch after consent (requestId: `2903d5c1`)

```
[2026-04-16T11:39:15Z] DEBUG: Gateway MCP call, doc_id=14D0iQOf..., gateway=https://acwslite-gateway-vefdk5ygab.gateway.bedroc
[2026-04-16T11:39:17Z] DEBUG: Got doc via Gateway, length=917862, trimmed=12000
[2026-04-16T11:39:17Z] {"level":"INFO","message":"Invocation completed successfully (2.220s)","requestId":"2903d5c1-6037-4401-91d0-c622ffe52963","sessionId":"m11-runtime-react-demo-000000000000001"}
```

### Additional invocations confirming stable operation

| Timestamp | Request ID | Duration | Result |
|---|---|---|---|
| 2026-04-16T11:44:57Z | `354d727f` | 2.142s | ✅ completed successfully |
| 2026-04-16T11:54:18Z | `114bb53f` | 1.963s | ✅ completed successfully |
| 2026-04-16T12:01:36Z | `f4d17cf8` | 2.179s | ✅ completed successfully |
| 2026-04-16T12:05:42Z | `d7246a21` | 1.169s | ✅ completed successfully |

**Observability dashboard:**  
`https://console.aws.amazon.com/cloudwatch/home?region=us-east-1#gen-ai-observability/agent-core`

---

## 5. Cleanup Confirmation

**Collected at:** `2026-04-16T12:39:20Z`

Cleanup was executed in two passes:

**Pass 1** — `cleanup_all()` deleted:
- Gateway Target `YXUCYTJXPI` ✅
- OAuth Provider `acwslite_google_provider` ✅
- Cognito User Pool `us-east-1_jOH5jzPsr` ✅

**Pass 2** — boto3 direct calls deleted:
- Runtime `acwslite_runtime_agent-caG2iY57j3` ✅
- Gateway `acwslite-gateway-vefdk5ygab` ✅

### Final verification

```
=== FINAL CLEANUP CONFIRMATION ===
Collected at: 2026-04-16T12:39:20.850774+00:00

Runtime: DELETED ✅ (ResourceNotFoundException)
Gateway: DELETED ✅ (ResourceNotFoundException)
Cognito Pool: DELETED ✅ (ResourceNotFoundException)
OAuth Provider: DELETED ✅ (ResourceNotFoundException)
```

All 4 AWS resources successfully deleted. No billable resources remain.

---

## 6. E2E Flow Summary

```
User (Cognito JWT)
  │
  ▼
AgentCore Runtime  ──►  get_google_doc()
  │                           │
  │                           ▼
  │                     AgentCore Gateway (MCP 2025-11-25)
  │                           │
  │                    [First call]        [Subsequent calls]
  │                    OAuth elicitation   Token from vault
  │                           │                   │
  │                           ▼                   ▼
  │                     Google Docs API  ──────────┘
  │                           │
  │                    Document JSON (917,862 bytes)
  │                           │
  ▼                           ▼
invoke()  ◄──────  parse + extract_google_doc_text()
  │
  ▼
Structured answer + source URL + tool_trace
```

| Check | Status |
|---|---|
| Runtime deployed via `BedrockAgentCoreApp` + `@app.entrypoint` + `app.run()` | ✅ |
| Gateway and Google Docs target configured and operational | ✅ |
| First invoke returns consent challenge | ✅ |
| Second invoke returns document answer with sources | ✅ |
| CloudWatch logs confirm at least 2 invocations | ✅ (6 invocations logged) |
| All resources deleted after testing | ✅ |