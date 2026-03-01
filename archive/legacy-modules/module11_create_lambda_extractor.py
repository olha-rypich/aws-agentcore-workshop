import io
import json
import os
import time
import zipfile

import boto3
from botocore.exceptions import ClientError


LAMBDA_FUNCTION_NAME = os.getenv("LAMBDA_FUNCTION_NAME", "AgentCoreGoogleDocExtractor")
LAMBDA_ROLE_NAME = os.getenv("LAMBDA_ROLE_NAME", "AgentCoreGoogleDocExtractorRole")
AWS_REGION = os.getenv("AWS_REGION", "us-east-1")
AWS_PROFILE = os.getenv("AWS_PROFILE", "workshop")
GATEWAY_ROLE_ARN = os.getenv("GATEWAY_ROLE_ARN")


if not GATEWAY_ROLE_ARN:
    raise RuntimeError("Set GATEWAY_ROLE_ARN before running this script")


def make_clients():
    session = boto3.Session(profile_name=AWS_PROFILE, region_name=AWS_REGION)
    return (
        session.client("iam", region_name=AWS_REGION),
        session.client("lambda", region_name=AWS_REGION),
    )


def build_zip() -> bytes:
    lambda_code = """
import json


def _extract_doc_text(doc: dict) -> str:
    body = doc.get("body", {})
    content = body.get("content", [])
    lines = []
    for item in content:
        paragraph = item.get("paragraph")
        if not paragraph:
            continue
        elements = paragraph.get("elements", [])
        parts = []
        for el in elements:
            tr = el.get("textRun")
            if tr:
                parts.append(tr.get("content", ""))
        line = "".join(parts).strip()
        if line:
            lines.append(line)
    return "\\n".join(lines)


def lambda_handler(event, context):
    tool_name = ""
    if getattr(context, "client_context", None) and context.client_context.custom:
        tool_name = context.client_context.custom.get("bedrockAgentCoreToolName", "")

    if "extract_google_doc_text" in tool_name:
        raw = event.get("google_doc_json", "{}")
        doc = json.loads(raw) if isinstance(raw, str) else raw
        text = _extract_doc_text(doc)
        return {
            "statusCode": 200,
            "body": json.dumps(
                {
                    "extracted_text": text,
                    "char_count": len(text),
                    "preview": text[:1200],
                }
            ),
        }

    return {
        "statusCode": 400,
        "body": json.dumps({"error": f"Unknown tool: {tool_name}"}),
    }
"""
    buf = io.BytesIO()
    with zipfile.ZipFile(buf, "w", zipfile.ZIP_DEFLATED) as zf:
        zf.writestr("lambda_function.py", lambda_code)
    return buf.getvalue()


def ensure_role(iam_client) -> str:
    assume_policy = {
        "Version": "2012-10-17",
        "Statement": [
            {
                "Effect": "Allow",
                "Principal": {"Service": "lambda.amazonaws.com"},
                "Action": "sts:AssumeRole",
            }
        ],
    }

    try:
        role = iam_client.create_role(
            RoleName=LAMBDA_ROLE_NAME,
            AssumeRolePolicyDocument=json.dumps(assume_policy),
        )
        role_arn = role["Role"]["Arn"]
        iam_client.attach_role_policy(
            RoleName=LAMBDA_ROLE_NAME,
            PolicyArn="arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole",
        )
        time.sleep(8)
        print("Created IAM role:", role_arn)
        return role_arn
    except iam_client.exceptions.EntityAlreadyExistsException:
        # Always reconcile trust policy for existing roles to avoid stale/bad policy.
        iam_client.update_assume_role_policy(
            RoleName=LAMBDA_ROLE_NAME,
            PolicyDocument=json.dumps(assume_policy),
        )
        # Ensure basic execution policy is attached (idempotent on IAM side).
        iam_client.attach_role_policy(
            RoleName=LAMBDA_ROLE_NAME,
            PolicyArn="arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole",
        )
        role_arn = iam_client.get_role(RoleName=LAMBDA_ROLE_NAME)["Role"]["Arn"]
        # Give IAM a short propagation window for trust-policy updates.
        time.sleep(10)
        print("IAM role already exists:", role_arn)
        return role_arn


def ensure_lambda(lambda_client, role_arn: str, zip_blob: bytes) -> str:
    arn = None
    for attempt in range(1, 7):
        try:
            created = lambda_client.create_function(
                FunctionName=LAMBDA_FUNCTION_NAME,
                Runtime="python3.12",
                Role=role_arn,
                Handler="lambda_function.lambda_handler",
                Code={"ZipFile": zip_blob},
                Description="Google Doc extractor for AgentCore workshop",
                Timeout=30,
                MemorySize=256,
            )
            arn = created["FunctionArn"]
            print("Created Lambda:", arn)
            break
        except lambda_client.exceptions.ResourceConflictException:
            arn = lambda_client.get_function(FunctionName=LAMBDA_FUNCTION_NAME)["Configuration"][
                "FunctionArn"
            ]
            lambda_client.update_function_code(FunctionName=LAMBDA_FUNCTION_NAME, ZipFile=zip_blob)
            print("Updated Lambda:", arn)
            break
        except ClientError as exc:
            code = exc.response.get("Error", {}).get("Code")
            message = exc.response.get("Error", {}).get("Message", "")
            assume_issue = (
                code == "InvalidParameterValueException"
                and "cannot be assumed by Lambda" in message
            )
            if assume_issue and attempt < 6:
                wait_s = 5 * attempt
                print(
                    f"Role propagation in progress (attempt {attempt}/6). "
                    f"Retrying in {wait_s}s..."
                )
                time.sleep(wait_s)
                continue
            raise

    if not arn:
        raise RuntimeError("Failed to create or update Lambda function")

    try:
        lambda_client.add_permission(
            FunctionName=LAMBDA_FUNCTION_NAME,
            StatementId="AllowAgentCoreGatewayInvoke",
            Action="lambda:InvokeFunction",
            Principal=GATEWAY_ROLE_ARN,
        )
        print("Added invoke permission for gateway role")
    except lambda_client.exceptions.ResourceConflictException:
        print("Invoke permission already exists")

    return arn


def main():
    iam_client, lambda_client = make_clients()
    role_arn = ensure_role(iam_client)
    zip_blob = build_zip()
    lambda_arn = ensure_lambda(lambda_client, role_arn, zip_blob)
    print("\nRESULT")
    print("LAMBDA_ARN=", lambda_arn)


if __name__ == "__main__":
    main()
