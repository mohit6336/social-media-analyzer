# Social Media Analyzer — (8-hour interview task)

A small web application that extracts text from uploaded PDFs/images (OCR), generates a short summary, suggests keywords/hashtags, and does a simplistic tone check. Built as an interview task/demo project — no paid services required.

## Features
- Upload PDF or image (drag & drop)
- OCR using Tesseract + Poppler
- Text summarization & keyword extraction (local Python/NLTK)
- Tone detection (basic keyword method)
- Authentication (JWT-based register/login)
- Per-user analysis history
- Download analysis report as PDF
- Clean dark glass UI built with React + Tailwind

## Tech stack
- Frontend: React + Vite + Tailwind CSS + react-dropzone + axios
- Backend: Python Flask
- OCR / Text extraction: Tesseract OCR + pdf2image (Poppler)
- NLP: NLTK (tokenize & stopwords)
- Auth: JWT (pyjwt) + werkzeug password hashing
- Deployment: Frontend (Vercel), Backend (Render using Docker recommended)

## Local dev (quick)
### Backend
```bash
cd backend
python -m venv venv
venv\Scripts\activate    # Windows
# or: source venv/bin/activate  # Mac / Linux
pip install -r requirements.txt
# ensure Tesseract and Poppler are installed on your machine and accessible
python app.py
