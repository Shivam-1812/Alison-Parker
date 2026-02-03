const express = require('express');
const router = express.Router();
const analyzeController = require('../controllers/analyzeController');
const multer = require('multer');
const path = require('path');

// Configure multer for file upload
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'uploads/');
    },
    filename: (req, file, cb) => {
        cb(null, `${Date.now()}-${file.originalname}`);
    }
});

const upload = multer({
    storage: storage,
    limits: { fileSize: 50 * 1024 * 1024 }, // 50MB limit
    fileFilter: (req, file, cb) => {
        if (path.extname(file.originalname).toLowerCase() !== '.zip') {
            return cb(new Error('Only ZIP files are allowed'));
        }
        cb(null, true);
    }
});

// ZIP file upload endpoint
router.post('/zip', upload.single('projectZip'), analyzeController.analyzeZipProject);

// GitHub repository URL endpoint
router.post('/github', analyzeController.analyzeGitHubProject);

module.exports = router;
