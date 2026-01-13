
import sys
import os
from flask import Flask

# 1. Set mocked env vars
os.environ['OPENAI_API_KEY'] = 'sk-mock-key'
os.environ['COINMARKETCAP_API_KEY'] = 'mock-key'

# 2. Import the app
print("Loading app...")
try:
    import app
    # The vercel middleware replaces app.wsgi_app, so app.app is the Flask object
    # but when imported, 'app' module has 'app' object.
    application = app.app
    print("✅ App loaded.")
except Exception as e:
    print(f"❌ Failed to load app: {e}")
    import traceback
    traceback.print_exc()
    sys.exit(1)

# 3. Simulate a Request to /api/python/crypto/xray/global
print("Simulating Request...")
try:
    # Minimal WSGI environ
    environ = {
        'REQUEST_METHOD': 'GET',
        'PATH_INFO': '/api/python/crypto/xray/global',
        'SERVER_NAME': 'localhost',
        'SERVER_PORT': '5001',
        'wsgi.version': (1, 0),
        'wsgi.url_scheme': 'http',
        'wsgi.input': sys.stdin,
        'wsgi.errors': sys.stderr,
        'wsgi.multithread': False,
        'wsgi.multiprocess': False,
        'wsgi.run_once': False,
    }

    def start_response(status, headers):
        print(f"Response Status: {status}")
        print(f"Headers: {headers}")

    # Call the application (which is wrapped by VercelMiddleware)
    response_body = application.wsgi_app(environ, start_response)
    
    print("Response Body Start:")
    for data in response_body:
        print(data.decode('utf-8')[:200] + "...")
        break # Just print first chunk
        
except Exception as e:
    print(f"❌ Request failed: {e}")
    import traceback
    traceback.print_exc()
