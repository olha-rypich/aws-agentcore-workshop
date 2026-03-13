import unittest
from unittest.mock import patch

import runtime_app_agentcore_full as runtime_app


class RuntimeAppTests(unittest.TestCase):
    def test_extract_google_doc_text_normalizes_runs(self) -> None:
        payload = {
            "body": {
                "content": [
                    {"paragraph": {"elements": [{"textRun": {"content": "Hello "}}]}},
                    {"paragraph": {"elements": [{"textRun": {"content": "world\n\n"}}]}},
                    {"paragraph": {"elements": [{"textRun": {"content": "Line 2"}}]}},
                ]
            }
        }

        text = runtime_app.extract_google_doc_text(payload)

        self.assertEqual(text, "Hello world\n\nLine 2")

    def test_build_structured_answer_for_summary(self) -> None:
        doc_text = (
            "Detection starts from monitoring alerts and customer reports.\n"
            "On-call engineers create tickets and assign severity.\n"
            "Responders mitigate impact and coordinate communication.\n"
        )

        answer = runtime_app.build_structured_answer(
            prompt="Summarize incident response in 6 bullets",
            doc_text=doc_text,
            source_url="https://docs.google.com/document/d/test/edit",
        )

        self.assertEqual(answer["kind"], "bullet_summary")
        self.assertEqual(len(answer["bullets"]), 3)
        self.assertEqual(
            answer["sources"],
            ["https://docs.google.com/document/d/test/edit"],
        )

    def test_build_structured_answer_returns_not_found_for_irrelevant_query(self) -> None:
        answer = runtime_app.build_structured_answer(
            prompt="What does the document say about Kubernetes autoscaling?",
            doc_text="This document only covers incident response roles and process.",
            source_url="https://docs.google.com/document/d/test/edit",
        )

        self.assertEqual(answer["kind"], "not_found")
        self.assertEqual(answer["bullets"], [])

    def test_invoke_returns_structured_answer_payload(self) -> None:
        fake_tool_output = (
            "DOCUMENT_TEXT:\n"
            "Detection starts from monitoring alerts and customer reports.\n"
            "On-call engineers create tickets and assign severity.\n\n"
            "SOURCE: https://docs.google.com/document/d/test/edit"
        )

        with (
            patch.object(runtime_app, "get_google_doc", return_value=fake_tool_output),
            patch.object(
                runtime_app,
                "get_settings",
                return_value={"DOC_CONTEXT_MAX_CHARS": 12000, "AWS_REGION": "us-east-1"},
            ),
        ):
            payload = runtime_app.invoke(
                {
                    "prompt": "Summarize incident response in 6 bullets",
                    "doc_id": "test-doc",
                    "user_access_token": "token",
                }
            )

        self.assertEqual(payload["answer_mode"], "deterministic_extractive")
        self.assertEqual(payload["answer"]["kind"], "bullet_summary")
        self.assertTrue(payload["answer"]["bullets"])
        self.assertIn("Sources:", payload["response"])


if __name__ == "__main__":
    unittest.main()
