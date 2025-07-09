# app.py (Flask Backend)

from flask import Flask, request, jsonify, send_from_directory
from flask_cors import CORS
import os
import uuid
from main import accident

app = Flask(__name__)
CORS(app)

UPLOAD_FOLDER = "uploads"
STATIC_FOLDER = "static"
os.makedirs(UPLOAD_FOLDER, exist_ok=True)
os.makedirs(STATIC_FOLDER, exist_ok=True)

@app.route('/upload', methods=['POST'])
def upload():
    video = request.files['video']
    location = request.form.get('location')
    filename = f"{uuid.uuid4()}.mp4"
    video_path = os.path.join(UPLOAD_FOLDER, filename)
    video.save(video_path)
    print(f"Received location: {location}")
    try:
        report, summary, image_paths = accident(video_path)
        image_urls = [f"/static/{img.split('static/')[-1]}" for img in image_paths]

        return jsonify({
            "report": report,
            "summary": summary,
            "images": image_urls
        })
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/static/<path:path>')
def serve_static(path):
    return send_from_directory('static', path)

if __name__ == '__main__':
    app.run(debug=True)

