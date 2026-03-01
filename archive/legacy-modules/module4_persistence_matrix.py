# /Users/cyrildubovik/Documents/Projects/aws-agentcore-workshop/module2_langgraph_two_node.py
from typing import Literal
from typing_extensions import TypedDict, NotRequired
from langchain_core.tools import tool
from langgraph.graph import StateGraph, START, END
from langgraph.checkpoint.memory import InMemorySaver


@tool
def get_stock_price_mock(symbol: str) -> str:
    """Return a deterministic mock stock price for a given ticker symbol."""
    prices = {"AAPL": "191.23", "MSFT": "412.10", "AMZN": "178.44"}
    return f"{symbol.upper()} mock price: {prices.get(symbol.upper(), 'N/A')}"


class AgentState(TypedDict):
    user_input: str
    route: NotRequired[Literal["tool", "direct", "clarify"]]
    answer: str
    tool_called: bool
    turn_count: NotRequired[int]


def route_node(state: AgentState):
    text = state["user_input"].lower()
    turn_count = state.get("turn_count", 0) + 1
    if len(text) < 8:
        return {"route": "clarify", "turn_count": turn_count}
    if "price" in text or "stock" in text:
        return {"route": "tool", "turn_count": turn_count}
    return {"route": "direct", "turn_count": turn_count}

def clarify_node(state: AgentState):
    ans = "Sorry, I couldn't determine the intent of your question. Please clarify if you want to use a tool or get a direct answer."
    return {"answer": ans, "tool_called": False, "route": "clarify"}

def tool_node(state: AgentState):
    text = state["user_input"].lower()
    symbol = "AAPL"
    for s in ["AAPL", "MSFT", "AMZN"]:
        if s.lower() in text:
            symbol = s
            break
    tool_result = get_stock_price_mock.invoke({"symbol": symbol})
    return {"answer": f"Tool result -> {tool_result}", "tool_called": True}


def direct_node(state: AgentState):
    text = state["user_input"].lower()
    if "agentcore runtime" in text:
        ans = "AgentCore Runtime hosts and runs your agent entrypoint as a managed cloud runtime."
    else:
        ans = "No tool needed for this question."
    return {"answer": ans, "tool_called": False}


def route_decision(state: AgentState):
    return {
        "tool": "tool_node",
        "direct": "direct_node",
        "clarify": "clarify_node",
    }.get(state["route"], "clarify_node")




def build_graph():
    g = StateGraph(AgentState)
    g.add_node("route_node", route_node)    
    g.add_node("tool_node", tool_node)
    g.add_node("direct_node", direct_node)
    g.add_node("clarify_node", clarify_node)

    g.add_edge(START, "route_node")
    g.add_conditional_edges("route_node", route_decision, {"tool_node": "tool_node", "direct_node": "direct_node", "clarify_node": "clarify_node"})
    g.add_edge("tool_node", END)
    g.add_edge("direct_node", END)
    g.add_edge("clarify_node", END)
    return g.compile(checkpointer=InMemorySaver())


if __name__ == "__main__":
    
    graph = build_graph()
   

    prompts = [
        "What is AAPL stock price today?",
        "Explain what AgentCore Runtime is in one line.",
        "short",
    ]

    input1 = {
        "user_input": prompts[0],
    }

    input2 = {
        "user_input": prompts[1],
    }

    input3 = {
        "user_input": prompts[2],
    }

    result = graph.invoke(input1, {"configurable": {"thread_id": "t1"}})
    print(f"Prompt: {prompts[0]}\nResponse: {result['answer']}\nRoute: {result['route']}\nTool Called: {result['tool_called']}\n{'-'*50}\nThread ID: t1\nTurn Count: {result.get('turn_count', 'N/A')}\n{'-'*50}")
    result = graph.invoke(input2, {"configurable": {"thread_id": "t1"}})  # continues t1
    print(f"Prompt: {prompts[1]}\nResponse: {result['answer']}\nRoute: {result['route']}\nTool Called: {result['tool_called']}\n{'-'*50}\nThread ID: t1\nTurn Count: {result.get('turn_count', 'N/A')}\n{'-'*50}")
    result = graph.invoke(input3, {"configurable": {"thread_id": "t2"}})
    print(f"Prompt: {prompts[2]}\nResponse: {result['answer']}\nRoute: {result['route']}\nTool Called: {result['tool_called']}\n{'-'*50}\nThread ID: t2\nTurn Count: {result.get('turn_count', 'N/A')}\n{'-'*50}")
