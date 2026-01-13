
import sys
import os

# Mock Env
os.environ['OPENAI_API_KEY'] = 'sk-test-key'
os.environ['COINMARKETCAP_API_KEY'] = 'test-key'

print("Attempting to import app...")
try:
    from app import app
    print("✅ App imported successfully.")
except Exception as e:
    print(f"❌ App import failed: {e}")
    sys.exit(1)

print("\n--- Testing Global X-Ray Logic ---")
try:
    with app.app_context():
        # Manually import what the function imports to test dependencies
        import ccxt
        from news_service import news_service
        from ai_service import ai_service
        
        print("Dependency imports successful.")
        
        # Test AI Service Mock
        mock_data = ai_service._get_mock_global_analysis()
        print("Mock Data generation successful.")
        
except Exception as e:
    print(f"❌ Logic Test Failed: {e}")
    import traceback
    traceback.print_exc()
