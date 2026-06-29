# Repos AI — ML Research Platform

> An intelligent machine learning research platform for the modern researcher.

[![Demo](https://img.shields.io/badge/Live-Demo-blue)](https://repos-ai.vercel.app)
[![License](https://img.shields.io/badge/License-MIT-green)](LICENSE)

## What is Repos AI?

Repos AI is an end-to-end machine learning research platform that enables researchers to:
- Experiment with 23 ML models across classification, regression and clustering tasks
- Access 20,000+ public datasets via OpenML or upload their own
- Compare models, build ensembles, and apply optimization techniques
- Generate publication-quality research reports as PDF
- Stay updated with live AI conference deadlines and research breakthroughs
- Get AI-powered research assistance that knows their own experiment history

## Architecture
which is not wanted here .

├── .DS_Store

├── .gitignore

├── README,md

├── backend

│   ├── .DS_Store

│   ├── .env

│   ├── .env.example

│   ├── .gitignore

│   ├── Procfile

│   ├── README.md

│   ├── agents

│   │   ├── .DS_Store

│   │   ├── executor.py

│   │   └── llm_planner.py

│   ├── api

│   │   ├── memory.py

│   │   └── routes.py

│   ├── config

│   │   └── config.py

│   ├── core

│   │   └── execution_state.py

│   ├── datasets

│   │   ├── .DS_Store

│   │   ├── metadata.json

│   │   ├── registry.py

│   │   ├── service.py

│   │   └── storage

│   │       └── heart_disease_sample.csv

│   ├── main.py

│   ├── memory

│   │   ├── .DS_Store

│   │   ├── registry.py

│   │   └── store.py

│   ├── models

│   │   ├── .DS_Store

│   │   ├── advanced_training.py

│   │   ├── registry.py

│   │   ├── runs.json

│   │   └── training.py

│   ├── plugins

│   │   ├── .DS_Store

│   │   ├── analyze_document.py

│   │   ├── email.py

│   │   ├── generate_workflow_image.py

│   │   ├── load_pdf.py

│   │   ├── loader.py

│   │   ├── registry.py

│   │   └── research_trends.py

│   ├── rag

│   │   ├── .DS_Store

│   │   ├── chroma_db

│   │   │   └── chroma.sqlite3

│   │   └── embedder.py

│   ├── reports

│   │   ├── generator.py

│   │   ├── metadata.json

│   │   └── storage

│   │       └── 55908fde-51a0-4719-a61f-9318d5788caa.pdf

│   ├── requirements.txt

│   └── uploads

├── frontend

│   ├── .env

│   ├── .env.production

│   ├── .gitignore

│   ├── README.md

│   ├── dist

│   │   ├── assets

│   │   │   ├── index-D33k-7G8.css

│   │   │   └── index-NduXKL_Z.js

│   │   ├── favicon.svg

│   │   ├── icons.svg

│   │   └── index.html

│   ├── eslint.config.js

│   ├── index.html

│   ├── package-lock.json

│   ├── package.json

│   ├── public

│   │   ├── favicon.svg

│   │   └── icons.svg

│   ├── src

│   │   ├── App.jsx

│   │   ├── assets

│   │   │   └── hero.png

│   │   ├── components

│   │   │   ├── Console

│   │   │   ├── Core

│   │   │   │   └── FlowOpsCore.jsx

│   │   │   ├── Effects

│   │   │   │   └── ParticleUniverse.jsx

│   │   │   ├── Modules

│   │   │   │   ├── AgentNetwork.jsx

│   │   │   │   └── DocumentHub.jsx

│   │   │   └── NavBar.jsx

│   │   ├── index.css

│   │   ├── main.jsx

│   │   ├── pages

│   │   │   ├── Dashboard.jsx

│   │   │   ├── EvaluationBoard.jsx

│   │   │   ├── ModelLab.jsx

│   │   │   └── ResearchLab.jsx

│   │   ├── services

│   │   └── styles

│   └── vite.config.js

├── package-lock.json

├── package.json

├── project_structure.txt

└── sample.pdf

30 directories, 78 files
## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 18, Vite, Tailwind CSS |
| Backend | FastAPI, Python 3.11+ |
| ML Engine | scikit-learn (23 models) |
| LLM | Groq — Llama 3.3 70B |
| Vector Search | ChromaDB |
| Dataset Search | OpenML API |
| Web Intelligence | DuckDuckGo Search |
| Reports | ReportLab PDF |

## Setup

### Backend
```bash
cd backend
python -m venv venv
source venv/bin/activate
pip install -r requirements.txt
cp .env.example .env
# Add GROQ_API_KEY to .env
uvicorn main:app --reload --port 8000
```

### Frontend
```bash
cd frontend
npm install
npm run dev
```

## Features

### Dataset Explorer
Browse sklearn built-in datasets or search 20,000+ OpenML datasets.
Upload your own CSV for custom experiments.

### Model Lab
4 experiment modes:
- **Single** — train one model, analyze results
- **Compare** — run multiple models side-by-side
- **Ensemble** — combine models (Voting, Stacking)
- **Optimize** — cross-validation + feature selection

### Evaluation Board
Compare all runs, select best model, generate PDF research report.

### Research Dashboard
- Live AI/ML conference deadlines (web-searched, real-time)
- Research Frontiers — latest breakthroughs updated daily
- Research Assistant — AI chatbot with memory of your experiments

## Author

**Karthika S**
Built for Google Student Research Program 2026

## License
MIT