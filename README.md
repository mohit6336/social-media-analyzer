                +----------------------+
                |      Frontend        |
                |  React + Vite +      |
                |  Tailwind + Dropzone |
                +----------+-----------+
                           |
                           | HTTPS
                           v
                +----------------------+
                |   Backend (Docker)   |
                |  Flask + Gunicorn    |
                |  OCR: Tesseract      |
                |  PDF: Poppler        |
                |  NLP: NLTK           |
                +----------+-----------+
                           |
                           | Local JSON Storage
                           v
               +---------------------------+
               | users.json + history.json |
               +---------------------------+
| Component         | URL                 |
| ----------------- | ------------------- |
| Frontend (Vercel) |https://social-media-analyzer-chi.vercel.app/ |
| Backend (Render)  |https://social-media-analyzer-uz4x.onrender.com/ |

Frontend

React + Vite

TailwindCSS (dark glass UI)

react-dropzone (drag & drop file upload)

Axios

jsPDF (PDF export)

Backend

Python Flask

Gunicorn (production server)

Dockerized with Tesseract + Poppler

JWT authentication

NLP (NLTK for summarization & keywords)

OCR

pytesseract

pdf2image

Poppler (pdftoppm) built inside Docker

Storage

JSON file storage for:

user accounts

user history

Backend

Python Flask

Gunicorn (production server)

Dockerized with Tesseract + Poppler

JWT authentication

NLP (NLTK for summarization & keywords)

OCR

pytesseract

pdf2image

Poppler (pdftoppm) built inside Docker

Storage

JSON file storage for:

user accounts

user history

🛠️ Project Features
✔ OCR from PDF & Images

Converts PDFs → images → text using Poppler + Tesseract.

✔ Smart Summarization (Local NLP)

Extractive summarizer using:

Tokenization

Stopwords filtering

Frequency scoring

✔ Keywords → Hashtags

Extracts the 5 most important words & converts them into hashtags.

✔ Tone Detection

Lightweight positive/negative word-based classifier.

✔ JWT Auth

Secure login/register using hashed passwords.

✔ History

Each user sees only their own uploaded analyses.

✔ Professional UI

Dark gradient background

Glassmorphism cards

Smooth drag-drop uploads

PDF export

Clipboard copy

🧭 Future Improvements (recommended)

Replace local summarizer → use LLM API (OpenAI / Gemini)

Replace Tesseract OCR → use cloud OCR (Vision API / OCR.Space)

Add database (MongoDB or PostgreSQL) instead of JSON

Add multi-language support (OCR + NLP)

Add sentiment model (transformer-based)

Deploy backend to scalable VM with Docker Compose

Add rate-limit + logging middleware

Add email verification + password reset flow

Add drag-drop multiple file processing

Add animations (Framer Motion)

📚 How to Run Locally (updated for Docker)
Backend:
cd backend
docker build -t social-analyzer-backend:local .
docker run -p 5000:5000 social-analyzer-backend:local

Frontend:
cd frontend
npm install
npm run dev
