from eth_staking_service import eth_staking_service
import json

metrics = eth_staking_service.get_staking_metrics()
print(json.dumps(metrics, indent=2, default=str))

# Validate key metrics
entry_count = metrics['entry_queue']
wait_days = metrics['entry_wait']['days']

print(f"\n--- Verification ---")
print(f"Entry Count: {entry_count} (Expected ~81,000)")
print(f"Wait Days: {wait_days} (Expected ~45)")
