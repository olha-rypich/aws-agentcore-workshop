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

### Goal
Create a Google OAuth app for a web application and get two values:
- `GOOGLE_CLIENT_ID`
- `GOOGLE_CLIENT_SECRET`

Do not finalize redirect URIs yet. First create the AgentCore credential provider in Step 2, then copy the AgentCore `callbackUrl` back into Google Cloud.

### Step-by-step for juniors

1. Open [Google Cloud Console](https://console.cloud.google.com/).
2. In the top navigation bar, click the current project selector.
3. If you already have a project for the workshop, select it.
4. If you do not have a project yet:
   - click `NEW PROJECT`;
   - enter a name such as `agentcore-workshop`;
   - click `CREATE`;
   - wait until Google switches you into that project.

### 1.1 Enable Google Docs API
1. In the left menu, open `APIs & Services` -> `Library`.
2. Search for `Google Docs API`.
3. Open it and click `Enable`.

Recommended:
1. Also search for `Google Drive API`.
2. Enable it too.

Why:
- for this workshop we read Google Docs directly;
- some Google Workspace flows are easier to troubleshoot when both Docs API and Drive API are enabled.

### 1.2 Configure OAuth consent screen
1. Open `APIs & Services` -> `OAuth consent screen`.
2. Choose user type:
   - `External` if you are using a personal Gmail account;
   - `Internal` only if you are inside a Google Workspace organization and understand the restriction.
3. Click `Create`.
4. Fill the basic fields:
   - `App name`: for example `AgentCore Workshop`;
   - `User support email`: your email;
   - `Developer contact information`: your email.
5. Save and continue.

If Google asks for extra sections such as scopes or branding:
1. Keep the form minimal.
2. Save the default configuration unless the screen explicitly requires something.

Important:
- if the app is in `Testing` mode and user type is `External`, only listed test users can sign in;
- add your own Google account under `Test users` if Google shows that step.

### 1.3 Create OAuth client credentials
1. Open `APIs & Services` -> `Credentials`.
2. Click `+ CREATE CREDENTIALS`.
3. Choose `OAuth client ID`.
4. For `Application type`, choose `Web application`.
5. Enter a name such as `agentcore-google-docs-workshop`.

For now:
- leave `Authorized JavaScript origins` empty unless your organization requires them;
- leave `Authorized redirect URIs` empty for the moment.

Why we leave redirect URIs empty:
- AgentCore generates the correct callback URL in Step 2;
- you will copy that exact value into Google Cloud in Step 3.

6. Click `Create`.
7. Copy the generated values:
   - `Client ID`
   - `Client secret`

### 1.4 Put the values into `.env`
Add them to your local `.env`:

```env
GOOGLE_CLIENT_ID=your-client-id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your-client-secret
```

### 1.5 Sanity check before returning to the workshop
Before moving on, verify:
1. You are in the correct Google Cloud project.
2. `Google Docs API` is enabled.
3. OAuth consent screen exists.
4. OAuth client type is `Web application`.
5. You saved `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET`.

Do not worry yet if redirect URIs are still empty. That is expected at this stage.

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
