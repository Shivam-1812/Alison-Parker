# AI Codebase Explainer - Project Report

## 📋 Project Overview

**Project Name:** Alison Parker - AI Codebase Explainer  
**Type:** Full-Stack Web Application  
**Purpose:** Automated codebase analysis and documentation tool that uses AI to generate comprehensive, beginner-friendly explanations of software projects.

**Problem Statement:** Developers joining new projects often struggle to understand complex codebases. Manual documentation is time-consuming and frequently outdated.

**Solution:** An intelligent system that analyzes uploaded project files (ZIP archives or GitHub repositories) and automatically generates detailed architectural explanations, flow diagrams, and developer onboarding guides.

---

## 🏗️ Technical Architecture

### **Stack:**
- **Frontend:** React + Vite, Axios, React Markdown, Lucide Icons
- **Backend:** Node.js + Express.js
- **AI Engine:** OpenRouter API (Trinity Large Preview model)
- **File Processing:** Multer, AdmZip, fs-extra
- **Diagram Generation:** Mermaid.js

### **Architecture Pattern:** 
Monorepo structure with separated frontend and backend services following REST API architecture.

```
Project Root
├── frontend/          # React application (Port 5173)
│   ├── src/
│   │   ├── components/   # ResultView, DiagramView, UploadForm
│   │   ├── pages/        # Home page
│   │   └── services/     # API integration
│   └── vite.config.js
│
└── backend/           # Express API server (Port 5000)
    ├── src/
    │   ├── controllers/  # analyzeController
    │   ├── routes/       # analyzeRoutes
    │   ├── services/     # AI, file, parser, GitHub, cleanup
    │   └── utils/        # metadataBuilder
    └── server.js
```

---

## 🔄 System Flow

1. **Upload Phase:** User uploads ZIP file or provides GitHub URL
2. **Extraction:** Secure extraction with safety checks (50MB limit, 1500 file limit)
3. **Detection:** Identifies project type (Node.js, Python, Java) and finds actual project root
4. **Analysis:** Scans files for routes, dependencies, authentication, and database usage
5. **AI Processing:** Sends metadata to OpenRouter API for comprehensive explanation
6. **Visualization:** Generates Mermaid architecture diagrams
7. **Display:** Shows results with metadata cards, detailed explanation, and interactive diagrams

---

## 🔌 Key Features

### **1. Multi-Source Support**
- ZIP file upload (up to 50MB)
- GitHub repository URL analysis
- Handles nested folder structures and monorepos

### **2. Intelligent Detection**
- **Project Types:** Node.js, Python, Java/Spring Boot
- **Databases:** MongoDB, PostgreSQL, MySQL, SQLite, Redis, Firebase/Firestore
- **Authentication:** JWT, Bcrypt, Passport.js, OAuth, Firebase Auth, Session-based
- **Routes:** Automatically extracts API endpoints with HTTP methods

### **3. Security Features**
- ZIP bomb protection (compression ratio checks)
- File size and count limits
- Safe file scanning (skips binary/large files)
- Automatic cleanup of temporary files
- CORS configuration

### **4. AI-Generated Documentation**
Produces 9 comprehensive sections:
1. Project Overview
2. Architecture & Structure
3. Request Flow & Logic
4. Authentication & Security
5. Database & Data Management
6. API Endpoints & Routes
7. Key Components & Files
8. Technology Stack Breakdown
9. Getting Started Guide

---

## 💻 Technology Breakdown

| Component | Technology | Purpose |
|-----------|-----------|---------|
| **Frontend Framework** | React + Vite | Fast, modern UI with hot reload |
| **HTTP Client** | Axios | API communication with timeout handling |
| **Markdown Rendering** | react-markdown | Display formatted explanations |
| **Diagram Rendering** | Mermaid.js | Interactive architecture diagrams |
| **Backend Framework** | Express.js | RESTful API server |
| **File Upload** | Multer | Multipart form data handling |
| **ZIP Processing** | AdmZip | Safe archive extraction |
| **File System** | fs-extra | Enhanced file operations |
| **AI Provider** | OpenRouter | Access to multiple LLM models |
| **Version Control** | Git + GitHub | Source code management |

---

## 🔐 Security Measures

- **Input Validation:** File type and size checks
- **Rate Limiting:** 120-second timeout for AI requests
- **Safe Extraction:** Validates file count and compression ratios
- **Path Traversal Prevention:** Secure file path handling
- **Temporary File Cleanup:** Automatic deletion after processing
- **Environment Variables:** Secure API key storage

---

## 📊 API Endpoints

### Backend Routes:
- `POST /api/analyze/zip` - Upload and analyze ZIP file
- `POST /api/analyze/github` - Analyze GitHub repository
- `GET /` - Health check endpoint

### Request Flow:
```
Client → Upload File → Multer Middleware → analyzeController
→ File Service (Extract) → Parser Service (Analyze)
→ AI Service (Generate Explanation) → Response → Client
```

---

## 🚀 Deployment & Configuration

### **Environment Variables:**
```env
GEMINI_API_KEY=<OpenRouter API Key>
PORT=5000
FRONTEND_URL=http://localhost:5173
MAX_ZIP_SIZE_MB=50
MAX_FILE_COUNT=1500
MAX_FILE_SIZE_MB=1
GITHUB_CLONE_TIMEOUT_MS=60000
```

### **Installation:**
```bash
# Backend
cd backend
npm install
npm run dev

# Frontend
cd frontend
npm install
npm run dev
```

---

## 📈 Performance Optimizations

- **Selective File Scanning:** Skips node_modules, .git, binary files
- **Limited Structure Data:** Sends only 50 items to AI
- **Timeout Management:** 90s backend, 120s frontend timeouts
- **Fallback Responses:** Returns basic summary if AI times out
- **Efficient Cleanup:** Automatic removal of processed files

---

## 🎯 Use Cases

1. **Developer Onboarding:** New team members understand codebase quickly
2. **Code Reviews:** Get architectural overview before reviewing
3. **Documentation:** Auto-generate project documentation
4. **Learning:** Students analyze open-source projects
5. **Migration Planning:** Understand legacy systems before refactoring

---

## 📝 Future Enhancements

- Support for more languages (Go, Rust, C#, PHP)
- Real-time collaboration features
- Export reports as PDF/HTML
- Integration with CI/CD pipelines
- Custom AI model selection
- Code quality metrics and recommendations
- Dependency vulnerability scanning

---

## 👥 Project Information

**Repository:** [GitHub - Shivam-1812/Alison-Parker](https://github.com/Shivam-1812/Alison-Parker)  
**Status:** Active Development  
**License:** Not specified  
**Last Updated:** February 2026

---

## 🏆 Key Achievements

✅ Successfully detects and analyzes Node.js, Python, and Java projects  
✅ Handles complex monorepo structures automatically  
✅ Generates comprehensive, beginner-friendly documentation  
✅ Processes projects up to 50MB with 1500+ files  
✅ Creates interactive Mermaid architecture diagrams  
✅ Implements robust security and error handling  
✅ Provides graceful fallbacks for AI timeouts  

---

**Generated:** February 3, 2026  
**Version:** 1.0.0
