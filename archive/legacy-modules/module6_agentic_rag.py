from typing import Literal
from typing_extensions import NotRequired, TypedDict
import re
from langgraph.graph import END, START, StateGraph

"""
LEARNER_TASKS (Module 6: Agentic RAG)

Goal:
- Add a retrieval path that the graph chooses only when needed.
- Prove both paths:
  1) retrieval path
  2) no-retrieval path

Current behavior:
- route_node sets needs_retrieval based on simple keyword logic.
- retrieve_node fetches mock context from a local KB dict.
- answer_node uses retrieved context if present, otherwise direct answer.

Your TODO checklist:
1) Expand KB_DOCS with at least 2 more docs.
2) Improve should_retrieve() keyword rules to reduce false positives.
3) Add one more test that should NOT retrieve and confirm route=direct.
4) Optional: add a confidence score to retrieval output.
"""


KB_DOCS = {
    "agentcore runtime": "AgentCore Runtime provides managed hosting, session handling, and deployment workflows for agents.",
    "agentcore memory": "AgentCore Memory enables short-term and long-term memory patterns across sessions and threads.",
    "langgraph": "LangGraph orchestrates stateful workflows with nodes, edges, and checkpoint-based persistence.",
    "agentcore identity": "AgentCore Identity manages authentication and authorization flows for secure agent access.",
    "agentcore gateway": "AgentCore Gateway exposes tools and APIs to agents through managed MCP-compatible endpoints.",
    "agentcore observability": "AgentCore Observability provides traces, logs, and metrics to debug and monitor agent runs.",
    "code interpreter": "AgentCore Code Interpreter runs Python in a managed sandbox for calculations and data analysis.",
    "browser tool": "AgentCore Browser enables controlled web navigation and interaction from agent workflows.",
}


class RagState(TypedDict):
    user_input: str
    needs_retrieval: NotRequired[bool]
    route: NotRequired[Literal["retrieve", "direct"]]
    retrieved_context: NotRequired[str]
    answer: NotRequired[str]
    confidence_score: NotRequired[float]



def should_retrieve(text: str) -> bool:
    # Simple rule-based retrieval gate for learning.
    keywords = ("agentcore", "langgraph", "memory", "runtime", "docs")
    return any(k in text for k in keywords)


def route_node(state: RagState):
    text = state["user_input"].lower()
    needs = should_retrieve(text)
    return {"needs_retrieval": needs, "route": "retrieve" if needs else "direct"}


def route_decision(state: RagState):
    return "retrieve_node" if state.get("needs_retrieval", False) else "answer_node"


def retrieve_node(state: RagState):
    text = state["user_input"].lower()
    query_tokens = set(re.findall(r"\w+", text))

    for key, value in KB_DOCS.items():
        if key in text:
            key_tokens = set(re.findall(r"\w+", key))
            confidence_score = round(
                len(query_tokens & key_tokens) / max(len(key_tokens), 1),
                2,
            )
            return {
                "retrieved_context": value,
                "confidence_score": confidence_score,
            }

    return {
        "retrieved_context": "No exact KB match. Use general guidance from workshop notes.",
        "confidence_score": 0.0,
    }


def answer_node(state: RagState):
    if state.get("needs_retrieval", False):
        ctx = state.get("retrieved_context", "")
        return {"answer": f"Using retrieved context: {ctx}"}
    return {"answer": "Direct answer path: no retrieval needed for this prompt."}


def build_graph():
    g = StateGraph(RagState)
    g.add_node("route_node", route_node)
    g.add_node("retrieve_node", retrieve_node)
    g.add_node("answer_node", answer_node)

    g.add_edge(START, "route_node")
    g.add_conditional_edges(
        "route_node",
        route_decision,
        {"retrieve_node": "retrieve_node", "answer_node": "answer_node"},
    )
    g.add_edge("retrieve_node", "answer_node")
    g.add_edge("answer_node", END)
    return g.compile()


def run_test(graph, prompt: str):
    result = graph.invoke({"user_input": prompt})
    print(f"\nPrompt: {prompt}")
    print(f"Route: {result.get('route')}")
    print(f"Needs Retrieval: {result.get('needs_retrieval')}")
    print(f"Retrieved Context: {result.get('retrieved_context')}")
    print(f"Answer: {result.get('answer')}")
    print(f"Confidence Score: {result.get('confidence_score')}")

if __name__ == "__main__":
    graph = build_graph()
    run_test(graph, "What does AgentCore Runtime provide?")
    run_test(graph, "Say hello in one short sentence.")
