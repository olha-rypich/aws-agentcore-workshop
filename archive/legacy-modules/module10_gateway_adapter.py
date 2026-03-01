import os
from dotenv import load_dotenv
import requests

load_dotenv()


GATEWAY_URL = os.getenv("GATEWAY_URL")
GATEWAY_TOKEN_ENDPOINT = os.getenv("GATEWAY_TOKEN_ENDPOINT")
GATEWAY_CLIENT_ID = os.getenv("GATEWAY_CLIENT_ID")
GATEWAY_CLIENT_SECRET = os.getenv("GATEWAY_CLIENT_SECRET")
GATEWAY_SCOPE = os.getenv("GATEWAY_SCOPE")


def get_gateway_token() -> str:
    response = requests.post(
        GATEWAY_TOKEN_ENDPOINT,
        data={
            "grant_type": "client_credentials",
            "client_id": GATEWAY_CLIENT_ID,
            "client_secret": GATEWAY_CLIENT_SECRET,
            "scope": GATEWAY_SCOPE,
        },
    )
    try:
        response.raise_for_status()
        token_data = response.json()
        return token_data["access_token"]
    except requests.HTTPError as e:
        print(f"Failed to get gateway token: {e.response.text}")
        raise

    

def mcp_request(method: str, params: dict) -> dict:
    token = get_gateway_token()
    headers = {"Authorization": f"Bearer {token}", 
               "Content-Type": "application/json"}
    response = requests.post(
        GATEWAY_URL,
        json={"jsonrpc": "2.0", "id": 1, "method": method, "params": params},
        headers=headers,    )
    response.raise_for_status()
    return response.json()


    

def list_tools() -> list[dict]:
    return mcp_request("tools/list", {})

def call_weather(location: str) -> dict:
    return mcp_request(
    "tools/call",
    {"name": "workshop-lambda-target___get_weather", "arguments": {"location": location}},
)

if __name__ == "__main__":
    tools = list_tools()
    weather = call_weather("Kyiv")
    print(tools)
    print(weather)
