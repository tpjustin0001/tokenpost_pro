
import os

target_file = '/Users/youngbeen/Library/Python/3.9/lib/python/site-packages/yfinance/calendars.py'

try:
    with open(target_file, 'r') as f:
        content = f.read()
    
    # Prepend from __future__ import annotations
    if 'from __future__ import annotations' not in content:
        content = 'from __future__ import annotations\n' + content
        print("Added future annotations.")
    else:
        print("Future annotations already present.")

    with open(target_file, 'w') as f:
        f.write(content)
        
    print("Successfully patched yfinance/calendars.py with future annotations")

except Exception as e:
    print(f"Error patching file: {e}")
