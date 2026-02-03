# Backend Upgrade - Quick Reference

## New API Endpoints

### 1. ZIP File Upload
```
POST http://localhost:5000/api/analyze/zip
Content-Type: multipart/form-data
Field: projectZip (file, max 50MB)
```

### 2. GitHub Repository Analysis
```
POST http://localhost:5000/api/analyze/github
Content-Type: application/json
Body: { "repoUrl": "https://github.com/username/repo" }
```

## Environment Variables

```env
# File Processing Limits
MAX_ZIP_SIZE_MB=50
MAX_FILE_COUNT=1500
MAX_FILE_SIZE_MB=1
MAX_EXTRACTION_DEPTH=10

# GitHub Clone Settings
GITHUB_CLONE_TIMEOUT_MS=60000
MAX_REPO_SIZE_MB=100

# Cleanup Settings
TEMP_FILE_MAX_AGE_MS=3600000
```

## New Services

- **safeFileScanner.js** - Intelligent file filtering
- **githubService.js** - GitHub repository cloning
- **cleanupService.js** - Automatic cleanup

## Security Features

✅ Zip bomb protection (file count & depth limits)  
✅ Command injection prevention  
✅ Binary file filtering  
✅ File size limits (50MB ZIP, 100MB repo, 1MB per file)  
✅ Timeout protection (60s for git clone)  
✅ Automatic cleanup

## Testing Commands

```bash
# Health check
curl http://localhost:5000/

# Test ZIP upload (replace with your ZIP file)
curl -X POST http://localhost:5000/api/analyze/zip \
  -F "projectZip=@project.zip"

# Test GitHub analysis
curl -X POST http://localhost:5000/api/analyze/github \
  -H "Content-Type: application/json" \
  -d '{"repoUrl": "https://github.com/expressjs/express"}'
```

## File Filtering Rules

**Ignored:**
- node_modules, .git, dist, build, coverage, logs
- .env files, binary files

**Allowed:**
- .js, .ts, .jsx, .tsx, package.json

**Limits:**
- Max 1500 files
- Max 1MB per file
- Max depth 10 levels

## Next Steps for Frontend

Update frontend to support GitHub URL input:
1. Add GitHub URL input field to Home.jsx
2. Add analyzeGitHub() function to api.js
3. Add toggle between ZIP/GitHub modes
