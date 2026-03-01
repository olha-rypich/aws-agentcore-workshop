from module10_gateway_adapter import call_weather



def run_agent(prompt: str) -> dict:
    trigger_words = ['weather', 'погода']
    if any(word in prompt.lower() for word in trigger_words):
        location = "Kyiv"
        weather_info = call_weather(location)
        return {"route": "gateway_tool", "tool_called": True, "answer": f"The current weather in {location} is: {weather_info}"}

    else:
        return {"route": "direct", "tool_called": False, "answer": "I don't know how to help with that."}




if __name__ == "__main__":
    prompts = [
        "What is the weather in Kyiv?",
        "What is AAPL stock price today?",
        "Explain what AgentCore Runtime is in one line.",
    ]

    for prompt in prompts:
        result = run_agent(prompt)
        print(f"Prompt: {prompt}\nRoute: {result['route']}\nTool Called: {result['tool_called']}\nAnswer: {result['answer']}\n{'-'*50}")