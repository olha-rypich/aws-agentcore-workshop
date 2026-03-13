import os
import unittest
from contextlib import redirect_stdout
from io import StringIO
from unittest.mock import MagicMock, patch

import requests

from workshop_helpers.agentcore_demo import WorkshopE2EDemo


class DemoHelperTests(unittest.TestCase):
    def make_demo(self) -> WorkshopE2EDemo:
        demo = WorkshopE2EDemo.__new__(WorkshopE2EDemo)
        demo.state = {}
        demo.aws_region = "us-east-1"
        demo.oauth_return_url = "http://127.0.0.1:18081/oauth2/callback"
        demo._callback_server = None
        demo._callback_thread = None
        return demo

    def tearDown(self) -> None:
        demo = getattr(self, "_demo", None)
        if demo is not None:
            demo.stop_callback_server()

    def test_runtime_network_configuration_defaults_to_public(self) -> None:
        demo = self.make_demo()
        self._demo = demo
        with patch.dict(os.environ, {}, clear=False):
            self.assertEqual(
                demo._runtime_network_configuration(),
                {"networkMode": "PUBLIC"},
            )

    def test_runtime_network_configuration_supports_vpc(self) -> None:
        demo = self.make_demo()
        self._demo = demo
        with patch.dict(
            os.environ,
            {
                "RUNTIME_NETWORK_MODE": "VPC",
                "RUNTIME_SUBNETS": "subnet-1,subnet-2",
                "RUNTIME_SECURITY_GROUPS": "sg-1,sg-2",
            },
            clear=False,
        ):
            self.assertEqual(
                demo._runtime_network_configuration(),
                {
                    "networkMode": "VPC",
                    "networkModeConfig": {
                        "subnets": ["subnet-1", "subnet-2"],
                        "securityGroups": ["sg-1", "sg-2"],
                    },
                },
            )

    def test_build_runtime_payload_keeps_visible_request_fields(self) -> None:
        demo = self.make_demo()
        self._demo = demo
        with patch.dict(os.environ, {"GOOGLE_DOC_ID": "doc-123"}, clear=False):
            payload = demo.build_runtime_payload(
                prompt="Summarize the document",
                thread_id="m11-runtime-react-demo-000000000000001",
                max_steps=7,
                max_doc_calls=2,
            )

        self.assertEqual(payload["prompt"], "Summarize the document")
        self.assertEqual(payload["doc_id"], "doc-123")
        self.assertEqual(payload["thread_id"], "m11-runtime-react-demo-000000000000001")
        self.assertEqual(payload["mcp_session_id"], "m11-runtime-react-demo-000000000000001")
        self.assertEqual(payload["max_steps"], 7)
        self.assertEqual(payload["max_doc_calls"], 2)

    def test_invoke_runtime_refreshes_expired_token(self) -> None:
        demo = self.make_demo()
        self._demo = demo
        demo.get_user_access_token = MagicMock(side_effect=["token-1", "token-2"])
        demo._runtime_url = MagicMock(return_value="https://example.com/runtime")

        first = MagicMock(status_code=401, text='{"message":"Token has expired"}', ok=False)
        second = MagicMock(status_code=200, ok=True)
        second.json.return_value = {"app_version": "ok", "oauth_session_uri": ""}

        with (
            patch.dict(os.environ, {"GOOGLE_DOC_ID": "doc-123"}, clear=False),
            patch("workshop_helpers.demo_runtime.requests.post", side_effect=[first, second]) as post,
        ):
            payload = demo.invoke_runtime()

        self.assertEqual(payload["app_version"], "ok")
        self.assertEqual(demo.get_user_access_token.call_count, 2)
        self.assertEqual(post.call_count, 2)

    def test_invoke_runtime_accepts_explicit_payload(self) -> None:
        demo = self.make_demo()
        self._demo = demo
        demo.get_user_access_token = MagicMock(return_value="token-1")
        demo._runtime_url = MagicMock(return_value="https://example.com/runtime")

        ok = MagicMock(status_code=200, ok=True)
        ok.json.return_value = {"app_version": "ok", "oauth_session_uri": ""}

        with (
            patch.dict(os.environ, {"GOOGLE_DOC_ID": "doc-123"}, clear=False),
            patch("workshop_helpers.demo_runtime.requests.post", return_value=ok) as post,
        ):
            payload = demo.invoke_runtime(
                payload={
                    "prompt": "Visible prompt",
                    "doc_id": "doc-123",
                    "thread_id": "m11-runtime-react-demo-000000000000001",
                    "mcp_session_id": "m11-runtime-react-demo-000000000000001",
                    "max_steps": 4,
                    "max_doc_calls": 1,
                }
            )

        request_json = post.call_args.kwargs["json"]
        self.assertEqual(payload["app_version"], "ok")
        self.assertEqual(request_json["prompt"], "Visible prompt")
        self.assertEqual(request_json["doc_id"], "doc-123")
        self.assertEqual(request_json["user_access_token"], "token-1")

    def test_smoke_test_gateway_refreshes_expired_token(self) -> None:
        demo = self.make_demo()
        self._demo = demo
        demo.state["gateway"] = {
            "gateway_url": "https://example.com/mcp",
            "mcp_version": "2025-11-25",
            "google_docs_tool_name": "tool-name",
        }
        demo.get_user_access_token = MagicMock(side_effect=["token-1", "token-2"])

        first = MagicMock(status_code=401, text='{"message":"Token has expired"}')
        second = MagicMock(status_code=200)
        second.json.return_value = {
            "jsonrpc": "2.0",
            "id": 1,
            "result": {"content": [{"type": "text", "text": "{}"}]},
        }

        with (
            patch.dict(os.environ, {"GOOGLE_DOC_ID": "doc-123"}, clear=False),
            patch("workshop_helpers.demo_gateway.requests.post", side_effect=[first, second]) as post,
        ):
            payload = demo.smoke_test_gateway()

        self.assertEqual(payload["status"], "healthy")
        self.assertEqual(demo.get_user_access_token.call_count, 2)
        self.assertEqual(post.call_count, 2)

    def test_complete_runtime_consent_uses_runtime_initiating_token(self) -> None:
        demo = self.make_demo()
        self._demo = demo
        demo.state["runtime_user_access_token"] = "runtime-token"
        demo.ac_data = MagicMock()
        demo.get_user_access_token = MagicMock(return_value="fresh-token")

        demo.complete_runtime_consent("urn:ietf:params:oauth:request_uri:test")

        demo.ac_data.complete_resource_token_auth.assert_called_once_with(
            userIdentifier={"userToken": "runtime-token"},
            sessionUri="urn:ietf:params:oauth:request_uri:test",
        )
        demo.get_user_access_token.assert_not_called()

    def test_callback_server_returns_success_page(self) -> None:
        demo = self.make_demo()
        self._demo = demo
        server_info = demo.start_callback_server()

        response = requests.get(
            f"http://{server_info['host']}:{server_info['port']}{server_info['path']}?code=ok",
            timeout=5,
        )
        callback = demo.wait_for_callback(timeout_sec=5)

        self.assertEqual(response.status_code, 200)
        self.assertIn("Consent complete", response.text)
        self.assertEqual(callback["query"]["code"], ["ok"])

    def test_print_runtime_result_renders_assistant_response_sources_and_trace(self) -> None:
        demo = self.make_demo()
        self._demo = demo
        buffer = StringIO()

        with redirect_stdout(buffer):
            demo.print_runtime_result(
                "SECOND INVOKE",
                {
                    "answer": {
                        "kind": "bullet_summary",
                        "bullets": ["Line one.", "Line two."],
                        "sources": ["https://docs.google.com/document/d/test/edit"],
                    },
                    "tool_trace": [
                        {"step": 1, "event": "tool_call", "tool": "get_google_doc"},
                        {"step": 2, "event": "tool_result", "tool": "get_google_doc"},
                    ],
                },
            )

        output = buffer.getvalue()
        self.assertIn("ASSISTANT RESPONSE:", output)
        self.assertIn("- Line one.", output)
        self.assertIn("SOURCES:", output)
        self.assertIn("https://docs.google.com/document/d/test/edit", output)
        self.assertIn("TOOL TRACE:", output)
        self.assertIn("step=1 event=tool_call tool=get_google_doc", output)


if __name__ == "__main__":
    unittest.main()
