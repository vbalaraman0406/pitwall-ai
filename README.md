# Pitwall.ai - F1 Analytics Platform

Real-time Formula 1 analytics powered by FastF1, FastAPI, and React.

## Tech Stack

### Backend
- **Python 3.12** with **FastAPI**
- **FastF1** for F1 timing data, telemetry, and results
- **scikit-learn / XGBoost** for race predictions
- **Google App Engine** deployment

### Frontend
- **React 18** with React Router
- **Tailwind CSS** with dark F1-inspired theme
- **Recharts** for data visualization
- **Axios** for API communication

## Quick Start

### Backend
```bash
cd backend
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000
```

### Frontend
```bash
cd frontend
npm install
npm start
```

## Project Structure
```
pitwall-ai/
  backend/
    app/
      main.py          # FastAPI application
      config.py         # Configuration
      routers/          # API route handlers
      services/         # Business logic & FastF1 wrapper
    requirements.txt
    Dockerfile
    app.yaml           # GAE config
  frontend/
    src/
      components/       # Reusable UI components
      pages/            # Route pages
      services/         # API client
    package.json
    tailwind.config.js
```

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | /api/health | Health check |
| GET | /api/races | Season calendar |
| GET | /api/races/{year}/{round} | Race details + results |
| GET | /api/drivers | All drivers |
| GET | /api/drivers/{id}/stats | Driver season stats |
| GET | /api/telemetry/{year}/{round}/{session}/{driver} | Telemetry data |
| GET | /api/predictions/{year}/{round} | Race predictions |

## License
MIT
