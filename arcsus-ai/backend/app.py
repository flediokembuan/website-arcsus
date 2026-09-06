"""
ARCSUS AI v3.4 - Flask Backend
AIML Chatbot + Material Comparator + Image Analysis
"""

from flask import Flask, request, jsonify, render_template, send_from_directory
from flask_cors import CORS
from chatbot import chatbot
import os
from datetime import datetime

# Setup paths
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
PROJECT_ROOT = os.path.dirname(BASE_DIR)
FRONTEND_DIR = os.path.join(PROJECT_ROOT, 'frontend')
UPLOAD_DIR = os.path.join(PROJECT_ROOT, 'uploads')

os.makedirs(UPLOAD_DIR, exist_ok=True)

# Init Flask app
app = Flask(
    __name__,
    template_folder=FRONTEND_DIR,
    static_folder=FRONTEND_DIR,
    static_url_path='/static'
)
CORS(app)


@app.route('/')
def index():
    return render_template('index.html')


@app.route('/static/<path:path>')
def send_static(path):
    return send_from_directory(FRONTEND_DIR, path)


@app.route('/api/chat', methods=['POST'])
def chat():
    """Endpoint chat utama"""
    try:
        data = request.get_json()
        if not data:
            return jsonify({'success': False, 'error': 'No JSON data received'}), 400
        
        user_message = data.get('message', '').strip()
        if not user_message:
            return jsonify({'success': False, 'error': 'Empty message'}), 400
        
        print(f"\n{'='*70}")
        print(f"📨 CHAT REQUEST")
        print(f"👤 User: '{user_message}'")
        
        bot_response = chatbot.get_response(user_message)
        
        print(f"🤖 Bot: '{bot_response[:100]}...'")
        print(f"{'='*70}\n")
        
        return jsonify({
            'success': True,
            'response': bot_response,
            'timestamp': datetime.now().isoformat()
        })
    except Exception as e:
        print(f"❌ ERROR in /api/chat: {e}")
        import traceback
        traceback.print_exc()
        return jsonify({'success': False, 'error': str(e)}), 500


@app.route('/api/health', methods=['GET'])
def health():
    """Health check endpoint"""
    stats = {}
    if hasattr(chatbot, 'parser'):
        stats = chatbot.parser.get_stats()
    elif hasattr(chatbot, 'engine'):
        stats = {'total_patterns': chatbot.patterns_loaded}
    else:
        stats = {'total_patterns': chatbot.patterns_loaded}
    
    return jsonify({
        'status': 'healthy',
        'bot_name': 'Arcsus AI',
        'version': '3.4.0',
        'total_patterns': chatbot.patterns_loaded,
        'aiml_loaded': chatbot.patterns_loaded > 0,
        'stats': stats
    })


@app.route('/api/test-aiml', methods=['GET'])
def test_aiml():
    """Test AIML pattern matching"""
    test_queries = [
        "APA ITU SUSTAINABLE ARCHITECTURE",
        "APA ITU GREEN BUILDING",
        "EFISIENSI ENERGI",
        "BANDINGKAN BETON DAN BAJA",
        "ANALISIS GAMBAR BANGUNAN"
    ]
    results = {query: chatbot.get_response(query) for query in test_queries}
    return jsonify({
        'patterns_loaded': chatbot.patterns_loaded,
        'test_results': results
    })


if __name__ == '__main__':
    print("\n" + "🚀" * 30)
    print("🏛️  ARCSUS AI v3.4 - Sustainable Architecture Chatbot")
    print("🚀" * 30)
    print(f"\n📝 AIML Parser: {chatbot.patterns_loaded} patterns")
    print(f"🌐 Server: http://localhost:5000")
    print(f"🧪 Test: http://localhost:5000/api/test-aiml")
    print(f"💚 Health: http://localhost:5000/api/health")
    print("\n" + "🚀" * 30 + "\n")
    app.run(debug=True, host='0.0.0.0', port=5000)