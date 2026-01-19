from flask import Flask, jsonify
import os

app = Flask(__name__)

@app.route('/')
def index():
    return "Hello from Minimal WSGI Test!"

@app.route('/api/version')
def version():
    return jsonify({
        "status": "active",
        "version": "minimal-test",
        "port": os.environ.get("PORT", "unknown")
    })

if __name__ == '__main__':
    port = int(os.environ.get('PORT', 5001))
    app.run(host='0.0.0.0', port=port)
