# Module 11: Google Docs RAG via AgentCore Gateway (USER_FEDERATION)

## What this module demonstrates
- AgentCore Runtime app (`archive/legacy-modules/module11_agentcore_runtime_app.py`)
- LangGraph retrieval workflow (`archive/legacy-modules/module11_google_docs_rag.py`)
- Gateway MCP tool call (`archive/legacy-modules/module11_google_docs_gateway_adapter.py`)
- Google OAuth consent flow for outbound credentials (via Gateway credential provider)

## Target architecture
1. Client invokes Runtime.
2. Runtime executes LangGraph.
3. Graph calls Gateway tool (`tools/call`) for Google Docs.
4. Gateway uses OAuth credential provider for Google Docs API.
5. Graph ranks chunks and returns evidence-based answer.

---

## 0) Prerequisites
- Existing AWS profile and region (`us-east-1` in your workshop).
- Existing Gateway (you already have `workshop-gateway`).
- Google Cloud project with Google Docs API enabled.

---

## 1) Create Google OAuth client (Google Cloud Console)
Create an OAuth client for Web application.

Keep these values:
- `GOOGLE_CLIENT_ID`
- `GOOGLE_CLIENT_SECRET`

Do not finalize redirect URIs yet. First create AgentCore credential provider (next step), then add the AgentCore callback URL.

---

## 2) Create AgentCore Identity credential provider for Google
```bash
cd /Users/cyrildubovik/Documents/Projects/aws-agentcore-workshop
source .venv/bin/activate
export AWS_PROFILE=workshop
export AWS_REGION=us-east-1

agentcore identity create-credential-provider \
  --name google-docs-provider \
  --type google \
  --client-id "$GOOGLE_CLIENT_ID" \
  --client-secret "$GOOGLE_CLIENT_SECRET" \
  --region us-east-1
```

From command output, copy:
- `callbackUrl`
- provider `ARN`

Export provider ARN:
```bash
export GOOGLE_PROVIDER_ARN='arn:aws:bedrock-agentcore:...:oauth2credentialprovider/google-docs-provider'
```

---

## 3) Add AgentCore callback URL to Google OAuth client
In Google Cloud Console:
1. Open your OAuth client.
2. Add AgentCore `callbackUrl` as an authorized redirect URI.
3. Save.

---

## 4) Attach Google Docs OpenAPI target to Gateway
Get Gateway ID:
```bash
agentcore gateway get-mcp-gateway --name workshop-gateway --region us-east-1
```

Export it:
```bash
export GATEWAY_ID='workshop-gateway-xxxxxxxxxx'
```

Create target using included helper (legacy module path):
```bash
python /Users/cyrildubovik/Documents/Projects/aws-agentcore-workshop/archive/legacy-modules/module11_setup_google_docs_gateway_target.py
```

List targets:
```bash
agentcore gateway list-mcp-gateway-targets --name workshop-gateway --region us-east-1
```

---

## 5) Prepare env for module 11 adapter
Set existing gateway auth env vars (same pattern as Module 10), plus tool name.

```bash
export GATEWAY_URL='https://<gateway-id>.gateway.bedrock-agentcore.us-east-1.amazonaws.com/mcp'
export GATEWAY_TOKEN_ENDPOINT='https://<your-cognito-domain>.auth.us-east-1.amazoncognito.com/oauth2/token'
export GATEWAY_CLIENT_ID='<gateway-client-id>'
export GATEWAY_CLIENT_SECRET='<gateway-client-secret>'
export GATEWAY_SCOPE='workshop-gateway/invoke'

# Update after tools/list (example: workshop-google-docs-target___getDocument)
export GOOGLE_DOCS_TOOL_NAME='<tool-name-from-tools-list>'
```

Discover tool name:
```bash
python /Users/cyrildubovik/Documents/Projects/aws-agentcore-workshop/archive/legacy-modules/module11_google_docs_gateway_adapter.py
```

---

## 6) Local run: Google Docs RAG module
```bash
python /Users/cyrildubovik/Documents/Projects/aws-agentcore-workshop/archive/legacy-modules/module11_google_docs_rag.py
```

Set a real Google Doc ID in:
- `/Users/cyrildubovik/Documents/Projects/aws-agentcore-workshop/archive/legacy-modules/module11_google_docs_rag.py`

If response contains authorization URL, open it, finish consent, then re-run same prompt.

---

## 7) Deploy Runtime app for module 11
Configure:
```bash
agentcore configure --entrypoint archive/legacy-modules/module11_agentcore_runtime_app.py --region us-east-1
```

Deploy with required env vars:
```bash
agentcore deploy \
  --env "GATEWAY_URL=$GATEWAY_URL" \
  --env "GATEWAY_TOKEN_ENDPOINT=$GATEWAY_TOKEN_ENDPOINT" \
  --env "GATEWAY_CLIENT_ID=$GATEWAY_CLIENT_ID" \
  --env "GATEWAY_CLIENT_SECRET=$GATEWAY_CLIENT_SECRET" \
  --env "GATEWAY_SCOPE=$GATEWAY_SCOPE" \
  --env "GOOGLE_DOCS_TOOL_NAME=$GOOGLE_DOCS_TOOL_NAME"
```

Invoke:
```bash
agentcore invoke '{
  "prompt":"Summarize key points from this document",
  "doc_id":"<google-doc-id>",
  "oauth_return_url":"http://localhost:8081/oauth2/callback"
}' --session-id m11-runtime-000000000000000000000000000000001
```

If you get authorization URL in response, complete consent and invoke again with the same payload.

---

## 8) Workshop talking points
- Runtime handles orchestration and state.
- Gateway abstracts external tool surface as MCP.
- Credential provider controls outbound auth to Google.
- LangGraph retrieval logic stays deterministic and testable.
- Session/thread keeps invocation continuity.
