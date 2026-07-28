# M Baazar Analytics Platform - Deployment Guide

## 1. Backend Deployment (Render)

### Step 1: Create a Web Service on Render
1. Go to [Render Dashboard](https://dashboard.render.com/) and click **New +** -> **Web Service**.
2. Connect your GitHub repository (`mb-olap-v2`).
3. Set the following details:
   - **Name**: `mbaazar-analytics-backend`
   - **Environment**: `Python 3`
   - **Region**: Select your preferred region (e.g. Singapore / Frankfurt)
   - **Build Command**: `pip install -r backend/requirements.txt`
   - **Start Command**: `uvicorn backend.app.main:app --host 0.0.0.0 --port $PORT`

### Step 2: Environment Variables on Render
Add the following in Render **Environment Variables**:
- `PYTHON_VERSION`: `3.11.0`
- `DUCKDB_PATH`: `backend/db/olap_warehouse.duckdb`

> **Note**: Render will automatically detect `render.yaml` if you choose **Blueprint** deployment.

---

## 2. Frontend Deployment (Vercel)

### Step 1: Deploy to Vercel
1. Go to [Vercel Dashboard](https://vercel.com/new) and import your GitHub repository (`mb-olap-v2`).
2. Set the **Root Directory** to `frontend`.
3. Framework Preset: **Next.js**.

### Step 2: Environment Variables on Vercel
In Vercel **Environment Variables**, add:
- `NEXT_PUBLIC_API_BASE_URL`: `https://<your-render-backend-url>.onrender.com/api/v1`

---

## 3. Local Development Verification
To run locally:
```bash
npm run dev
```
- Backend FastAPI Docs: `http://localhost:8000/docs`
- Frontend Web App: `http://localhost:3000`
