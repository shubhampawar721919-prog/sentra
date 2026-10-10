import os
import requests
from dotenv import load_dotenv

load_dotenv()
api_key = os.getenv("GROQ_API_KEY")

headers = {
    "Authorization": f"Bearer {api_key}"
}
url = "https://api.groq.com/openai/v1/models"

response = requests.get(url, headers=headers)
models = response.json().get("data", [])
for model in models:
    print(model["id"])
