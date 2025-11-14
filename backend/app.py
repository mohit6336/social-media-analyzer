# app.py (replace existing file with this content)
from flask import Flask, request, jsonify
from flask_cors import CORS
import pytesseract
from pdf2image import convert_from_path
from PIL import Image
import os
import uuid
import nltk
from nltk.tokenize import sent_tokenize, word_tokenize
from nltk.corpus import stopwords
import string
import json
from werkzeug.security import generate_password_hash, check_password_hash
import jwt
from datetime import datetime, timedelta
from dotenv import load_dotenv

# load .env
load_dotenv()
SECRET_KEY = os.getenv("SECRET_KEY", "dev_secret")
JWT_ALGO = os.getenv("JWT_ALGO", "HS256")
POPPLER_PATH = r"C:\Users\Chauhan Mohit\AppData\Local\Microsoft\WinGet\Packages\oschwartz10612.Poppler_Microsoft.Winget.Source_8wekyb3d8bbwe\poppler-25.07.0\Library\bin"
pytesseract.pytesseract.tesseract_cmd = r"C:\Program Files\Tesseract-OCR\tesseract.exe"

USERS_FILE = "users.json"
HISTORY_FILE = "history.json"

# helpers to persist demo data
def load_json(path):
    if not os.path.exists(path):
        with open(path, "w") as f:
            json.dump({}, f)
    with open(path, "r") as f:
        return json.load(f)

def save_json(path, data):
    with open(path, "w") as f:
        json.dump(data, f, indent=2)

# create files if missing
load_json(USERS_FILE)
load_json(HISTORY_FILE)

# ---------- Summarizer / keywords / tone (same as before) ----------
def summarize_text(text, max_sentences=3):
    if not text or len(text.strip()) < 50:
        return "(Not enough text to summarize)"
    sentences = sent_tokenize(text)
    if len(sentences) <= max_sentences:
        return text
    stop_words = set(stopwords.words("english"))
    words = word_tokenize(text.lower())
    freq = {}
    for w in words:
        if w not in stop_words and w not in string.punctuation:
            freq[w] = freq.get(w, 0) + 1
    sentence_scores = {}
    for sent in sentences:
        for w in word_tokenize(sent.lower()):
            if w in freq:
                sentence_scores[sent] = sentence_scores.get(sent, 0) + freq[w]
    ranked = sorted(sentence_scores, key=sentence_scores.get, reverse=True)
    summary = " ".join(ranked[:max_sentences])
    return summary

def extract_keywords(text, top_n=5):
    stop_words = set(stopwords.words("english"))
    words = word_tokenize(text.lower())
    words = [w for w in words if w not in stopwords.words("english") and w not in string.punctuation]
    freq = {}
    for w in words:
        freq[w] = freq.get(w, 0) + 1
    keywords = sorted(freq, key=freq.get, reverse=True)[:top_n]
    hashtags = [f"#{kw}" for kw in keywords]
    return hashtags

positive_words = ["good", "great", "excellent", "amazing", "positive", "love"]
negative_words = ["bad", "poor", "terrible", "negative", "hate"]
def detect_tone(text):
    t = text.lower()
    pos = sum(word in t for word in positive_words)
    neg = sum(word in t for word in negative_words)
    if pos > neg:
        return "Positive"
    elif neg > pos:
        return "Negative"
    else:
        return "Neutral"

# ---------- Flask app ----------
app = Flask(__name__)
CORS(app)

UPLOAD_FOLDER = "uploads"
os.makedirs(UPLOAD_FOLDER, exist_ok=True)

@app.route("/", methods=["GET"])
def home():
    return jsonify({"message": "Backend OK, OCR Ready"})

# ----------------- AUTH -----------------
def create_token(email):
    payload = {
        "sub": email,
        "iat": datetime.utcnow().timestamp(),
        "exp": (datetime.utcnow() + timedelta(days=1)).timestamp()
    }
    token = jwt.encode(payload, SECRET_KEY, algorithm=JWT_ALGO)
    return token

def verify_token(token):
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[JWT_ALGO])
        return payload.get("sub")
    except Exception:
        return None

@app.route("/auth/register", methods=["POST"])
def register():
    body = request.get_json() or {}
    email = body.get("email")
    password = body.get("password")
    name = body.get("name", email.split("@")[0] if email else "user")
    if not email or not password:
        return jsonify({"error": "email and password required"}), 400
    users = load_json(USERS_FILE)
    if email in users:
        return jsonify({"error": "user already exists"}), 400
    users[email] = {
        "name": name,
        "password": generate_password_hash(password)
    }
    save_json(USERS_FILE, users)
    token = create_token(email)
    return jsonify({"token": token, "name": name})

@app.route("/auth/login", methods=["POST"])
def login():
    body = request.get_json() or {}
    email = body.get("email")
    password = body.get("password")
    if not email or not password:
        return jsonify({"error": "email and password required"}), 400
    users = load_json(USERS_FILE)
    user = users.get(email)
    if not user or not check_password_hash(user["password"], password):
        return jsonify({"error": "invalid credentials"}), 401
    token = create_token(email)
    return jsonify({"token": token, "name": user.get("name", email.split("@")[0])})

# Protected route decorator (simple)
def require_auth(fn):
    def wrapper(*args, **kwargs):
        auth = request.headers.get("Authorization", "")
        if not auth.startswith("Bearer "):
            return jsonify({"error": "missing auth token"}), 401
        token = auth.split(" ", 1)[1]
        email = verify_token(token)
        if not email:
            return jsonify({"error": "invalid token"}), 401
        request.user_email = email
        return fn(*args, **kwargs)
    wrapper.__name__ = fn.__name__
    return wrapper

# ----------------- ANALYZE (protected) -----------------
@app.route("/analyze", methods=["POST"])
@require_auth
def analyze():
    if "file" not in request.files:
        return jsonify({"error": "No file uploaded"}), 400
    file = request.files["file"]
    file_id = str(uuid.uuid4())
    filename = f"{file_id}_{file.filename}"
    filepath = os.path.join(UPLOAD_FOLDER, filename)
    file.save(filepath)
    text = ""
    try:
        if file.filename.lower().endswith(".pdf"):
            pages = convert_from_path(filepath, 300, poppler_path=POPPLER_PATH)
            for page in pages:
                text += pytesseract.image_to_string(page) + "\n"
        else:
            img = Image.open(filepath)
            text = pytesseract.image_to_string(img)
        summary = summarize_text(text)
        keywords = extract_keywords(text)
        tone = detect_tone(text)
        result = {
            "id": file_id,
            "filename": file.filename,
            "extracted_text": text.strip(),
            "summary": summary,
            "keywords": keywords,
            "tone": tone,
            "timestamp": datetime.utcnow().isoformat()
        }
        # save to history per user
        hist = load_json(HISTORY_FILE)
        user_hist = hist.get(request.user_email, [])
        user_hist.insert(0, result)  # newest first
        hist[request.user_email] = user_hist[:30]  # limit 30
        save_json(HISTORY_FILE, hist)
        return jsonify(result)
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route("/history", methods=["GET"])
@require_auth
def history():
    hist = load_json(HISTORY_FILE)
    user_hist = hist.get(request.user_email, [])
    return jsonify(user_hist)

if __name__ == "__main__":
    app.run(port=5000, debug=True)

#     cd C:\projects\social-media-analyzer\backend
# venv\Scripts\activate
# python app.py

