
import os

target_file = '/Users/youngbeen/Library/Python/3.9/lib/python/site-packages/yfinance/calendars.py'

try:
    with open(target_file, 'r') as f:
        content = f.read()
    
    # 1. Add Union to imports if missing
    if 'from typing import Any' in content and 'Union' not in content:
        content = content.replace('from typing import Any', 'from typing import Any, Union')
    
    # 2. Patch the type hint
    old_hint = 'list[Any] | list["CalendarQuery"]'
    new_hint = 'Union[list[Any], list["CalendarQuery"]]'
    
    if old_hint in content:
        content = content.replace(old_hint, new_hint)
        print("Patched type hint.")
    else:
        print("Type hint not found or already patched.")

    with open(target_file, 'w') as f:
        f.write(content)
        
    print("Successfully patched yfinance/calendars.py")

except Exception as e:
    print(f"Error patching file: {e}")
