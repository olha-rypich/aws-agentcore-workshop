from module2_langgraph_two_node import build_graph


prompts = [
        "What is AAPL stock price today?",
        "Explain what AgentCore Runtime is in one line.",
        "short",
        "What is the weather in Kyiv?",
    ]
graph = build_graph()

def invoke(payload: dict):
    
    result = graph.invoke(
        {
            "user_input": payload["prompt"],
        }
    )
    return {
    "response": result["answer"],
    "route": result["route"],
    "tool_called": result["tool_called"],
    }


if __name__ == "__main__":
    for p in prompts:
        result = invoke({"prompt": p})
        print(f"Prompt: {p}\nResponse: {result['response']}\nRoute: {result['route']}\nTool Called: {result['tool_called']}\n{'-'*50}")
    