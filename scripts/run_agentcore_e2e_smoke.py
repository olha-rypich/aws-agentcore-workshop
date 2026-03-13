#!/usr/bin/env python3
from __future__ import annotations

import argparse
import json
import sys
from pathlib import Path
from typing import Any

ROOT = Path(__file__).resolve().parents[1]
if str(ROOT) not in sys.path:
    sys.path.insert(0, str(ROOT))

from workshop_helpers.agentcore_demo import WorkshopE2EDemo


def summarize(payload: dict[str, Any]) -> dict[str, Any]:
    answer = payload.get("answer") or {}
    return {
        "app_version": payload.get("app_version"),
        "answer_mode": payload.get("answer_mode"),
        "consent_required": payload.get("consent_required"),
        "answer_kind": answer.get("kind"),
        "bullets": answer.get("bullets") or [],
        "sources": answer.get("sources") or [],
        "authorization_url": payload.get("authorization_url"),
        "oauth_session_uri": payload.get("oauth_session_uri"),
        "thread_id": payload.get("thread_id"),
    }


def main() -> None:
    parser = argparse.ArgumentParser(description="Run the AgentCore Google Docs workshop E2E smoke flow.")
    parser.add_argument("--skip-deploy", action="store_true", help="Reuse the existing runtime instead of redeploying.")
    parser.add_argument("--timeout", type=int, default=180, help="Seconds to wait for the OAuth callback.")
    parser.add_argument(
        "--prompt-1",
        default="Summarize incident response from this document in 6 bullets and include source.",
        help="Prompt for the first runtime invoke.",
    )
    parser.add_argument(
        "--prompt-2",
        default="Answer in 6 bullets: summarize incident response from the document and cite source link from the document.",
        help="Prompt for the second runtime invoke after consent.",
    )
    parser.add_argument(
        "--no-browser",
        action="store_true",
        help="Do not open the authorization URL in the default browser.",
    )
    args = parser.parse_args()

    demo = WorkshopE2EDemo()
    result: dict[str, Any] = {"summary": demo.summary()}

    stack = demo.ensure_gateway_stack()
    result["gateway_stack"] = {
        "inbound": {"user_pool_id": stack["inbound"]["user_pool_id"], "user_client_id": stack["inbound"]["user_client_id"]},
        "provider": {"provider_name": stack["provider"]["provider_name"], "callback_url": stack["provider"]["callback_url"]},
        "gateway": {
            "gateway_id": stack["gateway"]["gateway_id"],
            "gateway_url": stack["gateway"]["gateway_url"],
            "google_docs_tool_name": stack["gateway"]["google_docs_tool_name"],
            "default_return_url": stack["gateway"]["default_return_url"],
        },
    }

    result["gateway_smoke"] = demo.smoke_test_gateway()

    if args.skip_deploy:
        result["runtime"] = {"status": "skipped"}
    else:
        result["runtime"] = demo.deploy_runtime()

    first = demo.invoke_runtime(prompt=args.prompt_1)
    demo.assert_runtime_version(first)
    result["first_invoke"] = summarize(first)

    if first.get("consent_required"):
        result["callback_server"] = demo.start_callback_server()
        consent = demo.complete_live_consent(
            first,
            timeout_sec=args.timeout,
            open_browser=not args.no_browser,
        )
        result["consent"] = consent

    second = demo.invoke_runtime(
        prompt=args.prompt_2,
        thread_id=first.get("thread_id"),
    )
    demo.assert_runtime_version(second)
    result["second_invoke"] = summarize(second)
    print(json.dumps(result, indent=2))


if __name__ == "__main__":
    main()
