from typing import Literal
from typing_extensions import NotRequired, TypedDict

from langgraph.graph import END, START, StateGraph

from module3_local_agent_entrypoint import invoke as run_base_agent

"""
LEARNER_TASKS (Module 5: Guardrail + HITL)

Goal:
- Add a risk gate before execution.
- Simulate human approval flow.
- Reuse Module 3 executor instead of rewriting agent logic.

Current behavior:
- Risk words ("deploy", "delete") require approval.
- If not approved -> pending_approval path.
- If approved -> execute path.

Your TODO checklist:
1) In execute_node(), include downstream metadata from base_result:
   - final_route = base_result["route"]
   - final_tool_called = base_result["tool_called"]
2) Add one more test case in __main__:
   - prompt: "Delete this S3 bucket", approved=False
   - expected status: pending_approval
3) Optional stretch:
   - return a structured object for approval details
   - include reason why approval is required
"""


class GuardrailState(TypedDict):
    user_input: str
    requires_approval: NotRequired[bool]
    approved: NotRequired[bool]
    final_answer: NotRequired[str]
    final_route: NotRequired[str]
    final_tool_called: NotRequired[bool]
    status: NotRequired[Literal["pending_approval", "executed"]]


def analyze_risk_node(state: GuardrailState):
    text = state["user_input"].lower()
    risky = ("deploy" in text) or ("delete" in text)
    return {"requires_approval": risky}


def route_after_risk(state: GuardrailState):
    if state.get("requires_approval", False) and not state.get("approved", False):
        return "approval_node"
    return "execute_node"


def approval_node(state: GuardrailState):
    return {
        "status": "pending_approval",
        "final_answer": "Approval required. Re-run with approved=True to continue.",
    }


def execute_node(state: GuardrailState):
    base_result = run_base_agent({"prompt": state["user_input"]})
    # TASK 1: keep downstream execution metadata for observability/debugging.
    return {
        "status": "executed",
        "final_answer": base_result["response"],
        "final_route": base_result["route"],
        "final_tool_called": base_result["tool_called"],
    }


def build_graph():
    g = StateGraph(GuardrailState)
    g.add_node("analyze_risk_node", analyze_risk_node)
    g.add_node("approval_node", approval_node)
    g.add_node("execute_node", execute_node)

    g.add_edge(START, "analyze_risk_node")
    g.add_conditional_edges(
        "analyze_risk_node",
        route_after_risk,
        {"approval_node": "approval_node", "execute_node": "execute_node"},
    )
    g.add_edge("approval_node", END)
    g.add_edge("execute_node", END)
    return g.compile()


def run_test(graph, prompt: str, approved: bool):
    state = {"user_input": prompt, "approved": approved}
    result = graph.invoke(state)
    print(f"\nPrompt: {prompt}")
    print(f"Approved: {approved}")
    print(f"Status: {result.get('status')}")
    print(f"Final Answer: {result.get('final_answer')}")
    print(f"Final Route: {result.get('final_route')}")
    print(f"Final Tool Called: {result.get('final_tool_called')}")


if __name__ == "__main__":
    graph = build_graph()
    run_test(graph, "What is AAPL stock price today?", approved=False)
    run_test(graph, "Deploy this Lambda function now", approved=False)
    run_test(graph, "Deploy this Lambda function now", approved=True)
    # TASK 2: verify risky delete action is blocked without approval.
    run_test(graph, "Delete this S3 bucket", approved=False)
