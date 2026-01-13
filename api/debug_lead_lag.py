import sys
import pandas as pd
try:
    from crypto_market.lead_lag.data_fetcher import fetch_all_data
    print("Import successful")
    df = fetch_all_data()
    print("Fetch Result:")
    print(df.head())
    print("Columns:", df.columns)
except Exception as e:
    import traceback
    traceback.print_exc()
