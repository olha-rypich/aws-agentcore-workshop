# /Users/cyrildubovik/Documents/Projects/aws-agentcore-workshop/src/module1_langchain_min_agent.py
from langchain_core.tools import tool

# Simple deterministic router (Module 1 focus: tool-call path clarity)
@tool
def get_stock_price_mock(symbol: str) -> str:
    """Return a deterministic mock stock price for a given ticker symbol."""
    prices = {"AAPL": "191.23", "MSFT": "412.10", "AMZN": "178.44"}
    return f"{symbol.upper()} mock price: {prices.get(symbol.upper(), 'N/A')}"

def run_agent(user_input: str) -> tuple[str, bool]:
    text = user_input.lower()
    if "price" in text or "stock" in text:
        symbol = "AAPL"
        for s in ["AAPL", "MSFT", "AMZN"]:
            if s.lower() in text:
                symbol = s
                break
        tool_result = get_stock_price_mock.invoke({"symbol": symbol})
        return f"Tool result -> {tool_result}", True

    # no-tool branch
    if "agentcore runtime" in text:
        return "AgentCore Runtime hosts and runs your agent entrypoint as a managed cloud runtime.", False
    return "No tool needed for this question.", False

if __name__ == "__main__":
    prompts = [
        "What is AAPL stock price today?",
        "Explain what AgentCore Runtime is in one line.",
    ]

    for i, p in enumerate(prompts, 1):
        output, called = run_agent(p)
        print(f"\nTest {i}")
        print(f"Prompt: {p}")
        print(f"Tool called: {called}")
        print(f"Output: {output}")
