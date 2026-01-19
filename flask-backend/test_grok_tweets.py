import os
from openai import OpenAI
from dotenv import load_dotenv

# Load env from parent dir (.env.local)
load_dotenv("../.env.local")

def test_grok_tweets():
    api_key = os.environ.get("XAI_API_KEY")
    if not api_key:
        print("Error: XAI_API_KEY not found.")
        return

    client = OpenAI(
        api_key=api_key,
        base_url="https://api.x.ai/v1"
    )

    try:
        print("Testing Grok 4.1 Fast for Real-time Tweets...")
        response = client.chat.completions.create(
            model="grok-4.1-fast",
            messages=[
                {"role": "system", "content": "You are a helpful assistant with access to real-time X (Twitter) data."},
                {"role": "user", "content": "Find 3 viral crypto tweets from the last 24 hours with over 1000 likes. Output the author, handle, and content."}
            ]
        )
        print("\n--- Response from Grok ---")
        print(response.choices[0].message.content)
        print("--------------------------")
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    test_grok_tweets()
