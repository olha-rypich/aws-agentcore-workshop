from bedrock_agentcore import BedrockAgentCoreApp

from module11_google_docs_rag import build_graph

app = BedrockAgentCoreApp()
graph = build_graph()


@app.entrypoint
def invoke(payload: dict, context=None):
    prompt = payload.get("prompt", "")
    doc_id = payload.get("doc_id", "")
    oauth_return_url = payload.get("oauth_return_url")
    force_authentication = bool(payload.get("force_authentication", False))
    thread_id = getattr(context, "session_id", None) or "module11-default-thread"

    result = graph.invoke(
        {
            "user_input": prompt,
            "doc_id": doc_id,
            "oauth_return_url": oauth_return_url,
            "force_authentication": force_authentication,
        },
        {"configurable": {"thread_id": thread_id}},
    )

    return {
        "response": result.get("answer"),
        "route": result.get("route"),
        "tool_called": result.get("tool_called"),
        "authorization_url": result.get("authorization_url"),
        "thread_id": thread_id,
    }


if __name__ == "__main__":
    app.run()
