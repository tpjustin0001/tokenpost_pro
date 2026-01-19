import requests
import re
import json

url = "https://www.validatorqueue.com/"
try:
    response = requests.get(url, headers={'User-Agent': 'Mozilla/5.0'})
    response.raise_for_status()
    
    # regex to find the array
    match = re.search(r'const historical_data = (\[.*?\]);', response.text, re.DOTALL)
    if match:
        data_str = match.group(1)
        # Clean up any trailing commas or JS specifics if needed, but JSON.parse usually expects strict JSON
        # The key names in JS might not be quoted.
        # Let's clean it: keys need quotes.
        # JS object: { date: "2023-01-01", ... } -> JSON: { "date": "2023-01-01", ... }
        
        # Simple regex to quote keys
        # This assumes keys are simple words
        data_str = re.sub(r'([a-zA-Z0-9_]+):', r'"\1":', data_str)
        # Fix potential single quotes to double quotes
        data_str = data_str.replace("'", '"')
        
        data = json.loads(data_str)
        
        with open('historical_data.json', 'w') as f:
            json.dump(data, f, indent=2)
            
        print(f"Successfully saved {len(data)} records to historical_data.json")
    else:
        print("Could not find historical_data in source")

except Exception as e:
    print(f"Error: {e}")
