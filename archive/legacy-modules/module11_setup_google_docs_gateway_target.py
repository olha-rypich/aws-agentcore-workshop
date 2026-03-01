import json
import os
import time

import boto3
from botocore.exceptions import ClientError

"""
Create a Gateway OpenAPI target for Google Docs with an existing OAuth2 credential provider.

Prerequisites:
1) Gateway already exists (you already have workshop-gateway).
2) Identity credential provider for Google already exists (provider ARN).
3) Export env vars:
   - AWS_REGION
   - GATEWAY_ID
   - GOOGLE_PROVIDER_ARN
Optional:
   - GOOGLE_DOCS_TARGET_NAME
   - GOOGLE_DOCS_SCOPE
   - GOOGLE_DOCS_GRANT_TYPE (default AUTHORIZATION_CODE)
   - GOOGLE_DOCS_DEFAULT_RETURN_URL (default http://localhost:8081/oauth2/callback)
"""


def require_env(name: str) -> str:
    value = os.getenv(name)
    if not value:
        raise RuntimeError(f"Missing required environment variable: {name}")
    return value


def build_google_docs_openapi() -> dict:
    return {
        "openapi": "3.0.1",
        "info": {"title": "Google Docs Minimal API", "version": "1.0.0"},
        "servers": [{"url": "https://docs.googleapis.com"}],
        "paths": {
            "/v1/documents/{documentId}": {
                "get": {
                    "operationId": "getDocument",
                    "summary": "Get Google Doc by ID",
                    "parameters": [
                        {
                            "name": "documentId",
                            "in": "path",
                            "required": True,
                            "schema": {"type": "string"},
                        }
                    ],
                    "responses": {"200": {"description": "Google Docs document payload"}},
                }
            }
        },
    }


def wait_ready(client, gateway_id: str, target_id: str, timeout_sec: int = 300):
    start = time.time()
    while time.time() - start < timeout_sec:
        target = client.get_gateway_target(gatewayIdentifier=gateway_id, targetId=target_id)
        status = target.get("status")
        print("Target status:", status)
        if status == "READY":
            return target
        if status in {"FAILED", "DELETING"}:
            raise RuntimeError(f"Target ended in status={status}")
        time.sleep(4)
    raise TimeoutError("Timed out waiting for target READY")


def find_target_id_by_name(client, gateway_id: str, target_name: str) -> str | None:
    next_token = None
    while True:
        kwargs = {"gatewayIdentifier": gateway_id, "maxResults": 1000}
        if next_token:
            kwargs["nextToken"] = next_token
        resp = client.list_gateway_targets(**kwargs)
        items = resp.get("items", [])
        for item in items:
            if item.get("name") == target_name:
                return item.get("targetId")
        next_token = resp.get("nextToken")
        if not next_token:
            break
    return None


def main():
    region = os.getenv("AWS_REGION", "us-east-1")
    profile = os.getenv("AWS_PROFILE")
    gateway_id = require_env("GATEWAY_ID")
    provider_arn = require_env("GOOGLE_PROVIDER_ARN")
    target_name = os.getenv("GOOGLE_DOCS_TARGET_NAME", "workshop-google-docs-target")
    scope = os.getenv("GOOGLE_DOCS_SCOPE", "https://www.googleapis.com/auth/documents.readonly")
    grant_type = os.getenv("GOOGLE_DOCS_GRANT_TYPE", "AUTHORIZATION_CODE")
    default_return_url = os.getenv(
        "GOOGLE_DOCS_DEFAULT_RETURN_URL", "http://localhost:8081/oauth2/callback"
    )

    openapi_spec = build_google_docs_openapi()
    if profile:
        session = boto3.Session(profile_name=profile, region_name=region)
    else:
        session = boto3.Session(region_name=region)
    client = session.client("bedrock-agentcore-control", region_name=region)

    request = {
        "gatewayIdentifier": gateway_id,
        "name": target_name,
        "targetConfiguration": {
            "mcp": {
                "openApiSchema": {
                    "inlinePayload": json.dumps(openapi_spec),
                }
            }
        },
        "credentialProviderConfigurations": [
            {
                "credentialProviderType": "OAUTH",
                "credentialProvider": {
                    "oauthCredentialProvider": {
                        "providerArn": provider_arn,
                        "scopes": [scope],
                        "grantType": grant_type,
                        "defaultReturnUrl": default_return_url,
                    }
                },
            }
        ],
    }

    try:
        created = client.create_gateway_target(**request)
        target_id = created["targetId"]
        print("Created target:", target_id)
    except ClientError as exc:
        code = exc.response.get("Error", {}).get("Code", "")
        if code == "UnrecognizedClientException":
            raise RuntimeError(
                "AWS credentials are invalid/expired. Re-login and set AWS_PROFILE.\n"
                "Try:\n"
                "  aws sso login --profile workshop\n"
                "  export AWS_PROFILE=workshop\n"
                "  aws sts get-caller-identity"
            ) from exc
        if code == "ConflictException":
            target_id = find_target_id_by_name(client, gateway_id, target_name)
            if not target_id:
                raise RuntimeError(
                    f"Target '{target_name}' already exists but targetId could not be resolved"
                ) from exc
            print(f"Target already exists: {target_id}")
            client.update_gateway_target(
                gatewayIdentifier=gateway_id,
                targetId=target_id,
                name=target_name,
                targetConfiguration=request["targetConfiguration"],
                credentialProviderConfigurations=request["credentialProviderConfigurations"],
            )
            print("Updated existing target with latest OAuth configuration.")
        else:
            raise

    print("Waiting for READY...")
    ready_target = wait_ready(client, gateway_id, target_id)
    print("Target READY:", ready_target["name"], ready_target["targetId"])


if __name__ == "__main__":
    main()
