const fileService = require('../services/fileService');
const parserService = require('../services/parserService');
const aiService = require('../services/aiService');
const metadataBuilder = require('../utils/metadataBuilder');
const githubService = require('../services/githubService');
const cleanupService = require('../services/cleanupService');
const path = require('path');

/**
 * Shared analysis logic for both ZIP and GitHub
 */
const performAnalysis = async (extractedPath) => {
    // 1. Get Structure using safe file scanner
    const scanResults = await fileService.getProjectStructure(extractedPath);
    console.log('📁 Scan Results:', { fileCount: scanResults.files.length, structure: scanResults.structure.slice(0, 5) });

    // 2. Analyze Codebase with scan results
    const analysisResult = await parserService.analyzeProject(extractedPath, scanResults);
    console.log('🔍 Analysis Result:', JSON.stringify(analysisResult, null, 2));

    // 3. Build Metadata
    const metadata = metadataBuilder.buildMetadata(
        analysisResult.type,
        scanResults.structure,
        analysisResult.data
    );
    console.log('📊 Metadata Built:', JSON.stringify(metadata.technologies, null, 2));

    // 4. Get AI Explanation
    const aiResponse = await aiService.generateExplanation(metadata, scanResults.structure);

    return {
        metadata,
        explanation: aiResponse.explanation,
        diagramDescription: aiResponse.mermaid_code,
        stats: scanResults.stats
    };
};

/**
 * Analyze ZIP project
 */
exports.analyzeZipProject = async (req, res) => {
    console.log('🚀 analyzeZipProject endpoint hit!');
    console.log('📨 Request file:', req.file ? 'Present' : 'Missing');

    if (!req.file) {
        console.log('❌ No file in request');
        return res.status(400).json({ error: 'No ZIP file uploaded' });
    }

    const zipPath = req.file.path;
    const extractDir = path.join(__dirname, '../../uploads', 'temp-' + Date.now());

    try {
        console.log('='.repeat(60));
        console.log(`📦 Processing ZIP file: ${req.file.originalname}`);
        console.log(`📏 File size: ${(req.file.size / 1024 / 1024).toFixed(2)} MB`);
        console.log(`📍 ZIP path: ${zipPath}`);
        console.log(`📂 Extract dir: ${extractDir}`);

        // Extract ZIP with safety checks
        const extractedPath = await fileService.extractZipSafe(zipPath, extractDir);
        console.log(`✅ Extracted to: ${extractedPath}`);

        // Perform analysis
        const result = await performAnalysis(extractedPath);

        // Respond
        console.log('✅ Analysis complete, sending response...');
        res.json(result);
        console.log('='.repeat(60));

    } catch (error) {
        console.error('❌ ZIP analysis failed:', error.message);
        console.error('Stack trace:', error.stack);

        // Handle specific error types
        if (error.message.includes('zip bomb') || error.message.includes('file limit exceeded')) {
            return res.status(413).json({
                error: 'ZIP file exceeds safety limits',
                details: error.message,
                code: 'ZIP_BOMB_DETECTED'
            });
        }

        res.status(500).json({
            error: 'Analysis failed',
            details: error.message,
            code: 'ANALYSIS_ERROR'
        });

    } finally {
        // Cleanup
        try {
            await cleanupService.cleanupMultiple([zipPath, extractDir]);
        } catch (cleanupErr) {
            console.error('Cleanup warning:', cleanupErr);
        }
    }
};

/**
 * Analyze GitHub repository
 */
exports.analyzeGitHubProject = async (req, res) => {
    const { repoUrl } = req.body;

    if (!repoUrl) {
        return res.status(400).json({
            error: 'Repository URL is required',
            code: 'MISSING_REPO_URL'
        });
    }

    // Validate GitHub URL
    if (!githubService.validateGitHubUrl(repoUrl)) {
        return res.status(400).json({
            error: 'Invalid GitHub URL',
            details: 'Only public GitHub.com repositories are supported',
            code: 'INVALID_GITHUB_URL'
        });
    }

    const repoName = githubService.getRepositoryName(repoUrl);
    const cloneDir = path.join(__dirname, '../../uploads', `github-${Date.now()}-${repoName}`);

    try {
        console.log(`Cloning GitHub repository: ${repoUrl}`);

        // Clone repository with safety checks
        const cloneResult = await githubService.cloneRepository(repoUrl, cloneDir);

        console.log(`Clone successful: ${cloneResult.path}`);

        // Perform analysis
        const result = await performAnalysis(cloneResult.path);

        // Add repository info to response
        result.repository = {
            url: repoUrl,
            name: repoName,
            size: cloneResult.size
        };

        // Respond
        res.json(result);

    } catch (error) {
        console.error('GitHub analysis failed:', error);

        // Handle specific error types
        if (error.message.includes('Invalid GitHub URL')) {
            return res.status(400).json({
                error: 'Invalid GitHub URL',
                details: error.message,
                code: 'INVALID_URL'
            });
        }

        if (error.message.includes('Repository size') || error.message.includes('exceeds maximum')) {
            return res.status(413).json({
                error: 'Repository too large',
                details: error.message,
                code: 'REPO_TOO_LARGE'
            });
        }

        if (error.message.includes('timeout')) {
            return res.status(408).json({
                error: 'Clone operation timed out',
                details: error.message,
                code: 'CLONE_TIMEOUT'
            });
        }

        if (error.message.includes('not found') || error.message.includes('private')) {
            return res.status(404).json({
                error: 'Repository not found or is private',
                details: error.message,
                code: 'REPO_NOT_FOUND'
            });
        }

        res.status(500).json({
            error: 'GitHub analysis failed',
            details: error.message,
            code: 'GITHUB_ANALYSIS_ERROR'
        });

    } finally {
        // Cleanup
        try {
            await cleanupService.cleanupPath(cloneDir);
        } catch (cleanupErr) {
            console.error('Cleanup warning:', cleanupErr);
        }
    }
};
