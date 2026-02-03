# AI Codebase Explainer MVP

A simple, powerful tool to analyze a codebase (Node.js, Python, Java) and generate an architectural explanation using Gemini AI.

## Project Structure
- `backend/`: Node.js Express server handling file upload, analysis, and AI integration.
- `frontend/`: React + Vite application for uploading generic projects and viewing results.

## Prerequisites
- Node.js (v14+)
- Helper API Key for Gemini (Flash model used by default).

##  Setup API Key
Ensure you have the API key in `backend/.env`.
```env
GEMINI_API_KEY=AIzaSy...
```

## Running the Application

### 1. Start the Backend
```bash
cd backend
npm install
npm run start
```
Server runs on `http://localhost:5000`.

### 2. Start the Frontend
Open a new terminal:
```bash
cd frontend
npm install
npm run dev
```
Frontend runs on `http://localhost:5173`.

## How to Use
1.  Open `http://localhost:5173` in your browser.
2.  Click **"Click to upload project (.zip)"**.
3.  Select a `.zip` file of a Node.js, Python, or Java project.
4.  Click **"Analyze"**.
5.  Wait for the AI to generate the explanation and architecture diagram.

## Features
- **Smart Detection**: Identifies routes, databases, and authentication methods.
- **AI Explanation**: Detailed breakdown of architecture and flow.
- **Visual Diagram**: Generates a Mermaid.js diagram of the system.
- **Secure**: All uploaded files are deleted after processing.

## Troubleshooting
- **Frontend not connecting?** Check `backend/.env` PORT and `frontend/vite.config.js` proxy settings.
- **Gemini Error?** Verify your API Key permissions.
