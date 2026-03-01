from module5_guardrail_hitl import build_graph
from bedrock_agentcore import BedrockAgentCoreApp


app = BedrockAgentCoreApp()
graph = build_graph()


@app.entrypoint
def invoke(payload: dict, context=None):
    prompt = payload.get("prompt", "")
    approved = payload.get("approved", False)
    thread_id = getattr(context, "session_id", None) or "default-thread"
    result = result = graph.invoke(
    {"user_input": prompt, "approved": approved},
    {"configurable": {"thread_id": thread_id}},
)

    return {
        "response": result.get("final_answer"),
        "status": result.get("status"),
        "route": result.get("final_route"),
        "tool_called": result.get("final_tool_called"),
        "thread_id": thread_id,
    }


if __name__ == "__main__":
    app.run()
    