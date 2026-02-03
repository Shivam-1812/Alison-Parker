const fs = require('fs-extra');
const path = require('path');
const { fileTypeFromFile } = require('file-type');

// Configuration with environment variable fallbacks
const MAX_FILE_COUNT = parseInt(process.env.MAX_FILE_COUNT) || 1500;
const MAX_FILE_SIZE_BYTES = (parseInt(process.env.MAX_FILE_SIZE_MB) || 1) * 1024 * 1024;
const MAX_DEPTH = parseInt(process.env.MAX_EXTRACTION_DEPTH) || 10;

// Directories and patterns to ignore
const IGNORE_PATTERNS = [
    'node_modules',
    '.git',
    'dist',
    'build',
    'coverage',
    'logs',
    '.next',
    '.cache',
    'tmp',
    'temp',
    '__pycache__',
    'venv',
    '.venv',
    'uploads'
];

// File patterns to ignore
const IGNORE_FILE_PATTERNS = [
    /^\.env/,           // .env files
    /^\.DS_Store$/,     // macOS files
    /^Thumbs\.db$/,     // Windows files
    /\.log$/,           // Log files
    /\.lock$/,          // Lock files
];

// Allowed file extensions (whitelist)
const ALLOWED_EXTENSIONS = [
    '.js',
    '.ts',
    '.jsx',
    '.tsx',
    '.json',  // Will be further filtered to only package.json
];

/**
 * Check if a directory should be ignored
 */
const shouldIgnoreDirectory = (dirName) => {
    return IGNORE_PATTERNS.includes(dirName);
};

/**
 * Check if a file should be ignored based on patterns
 */
const shouldIgnoreFile = (fileName) => {
    return IGNORE_FILE_PATTERNS.some(pattern => pattern.test(fileName));
};

/**
 * Check if file extension is allowed
 */
const isAllowedExtension = (fileName) => {
    const ext = path.extname(fileName).toLowerCase();

    // Special case: only allow package.json for JSON files
    if (ext === '.json') {
        return fileName === 'package.json';
    }

    return ALLOWED_EXTENSIONS.includes(ext);
};

/**
 * Check if a file is binary
 */
const isBinaryFile = async (filePath) => {
    try {
        const type = await fileTypeFromFile(filePath);
        return type !== undefined; // If file-type detects a type, it's binary
    } catch (error) {
        // If error, assume text file
        return false;
    }
};

/**
 * Get file size safely
 */
const getFileSize = async (filePath) => {
    try {
        const stats = await fs.stat(filePath);
        return stats.size;
    } catch (error) {
        return 0;
    }
};

/**
 * Recursively scan directory with safety limits
 * @param {string} dirPath - Directory to scan
 * @param {object} options - Scanning options
 * @returns {Promise<object>} - Scan results with files and metadata
 */
const scanDirectory = async (dirPath, options = {}) => {
    const {
        maxFiles = MAX_FILE_COUNT,
        maxDepth = MAX_DEPTH,
        maxFileSize = MAX_FILE_SIZE_BYTES,
        includeContent = false
    } = options;

    const results = {
        files: [],
        structure: [],
        stats: {
            totalFiles: 0,
            totalDirectories: 0,
            skippedFiles: 0,
            skippedDirectories: 0,
            totalSize: 0
        }
    };

    /**
     * Recursive scan function
     */
    async function scan(directory, relativePath = '', depth = 0) {
        // Check depth limit
        if (depth > maxDepth) {
            results.stats.skippedDirectories++;
            return;
        }

        // Check file count limit
        if (results.stats.totalFiles >= maxFiles) {
            return;
        }

        let items;
        try {
            items = await fs.readdir(directory, { withFileTypes: true });
        } catch (error) {
            console.error(`Error reading directory ${directory}:`, error.message);
            return;
        }

        for (const item of items) {
            // Stop if we've hit file limit
            if (results.stats.totalFiles >= maxFiles) {
                break;
            }

            const itemPath = path.join(directory, item.name);
            const relPath = path.join(relativePath, item.name).replace(/\\/g, '/');

            if (item.isDirectory()) {
                // Check if directory should be ignored
                if (shouldIgnoreDirectory(item.name)) {
                    results.stats.skippedDirectories++;
                    continue;
                }

                results.structure.push({ type: 'directory', path: relPath });
                results.stats.totalDirectories++;

                // Recurse into directory
                await scan(itemPath, relPath, depth + 1);

            } else if (item.isFile()) {
                // Check if file should be ignored
                if (shouldIgnoreFile(item.name)) {
                    results.stats.skippedFiles++;
                    continue;
                }

                // Check extension whitelist
                if (!isAllowedExtension(item.name)) {
                    results.stats.skippedFiles++;
                    continue;
                }

                // Check file size
                const fileSize = await getFileSize(itemPath);
                if (fileSize > maxFileSize) {
                    results.stats.skippedFiles++;
                    continue;
                }

                // Check if binary
                const isBinary = await isBinaryFile(itemPath);
                if (isBinary) {
                    results.stats.skippedFiles++;
                    continue;
                }

                // File passes all checks
                results.structure.push({ type: 'file', path: relPath });
                results.stats.totalFiles++;
                results.stats.totalSize += fileSize;

                const fileInfo = {
                    path: itemPath,
                    relativePath: relPath,
                    name: item.name,
                    size: fileSize,
                    extension: path.extname(item.name)
                };

                // Optionally include content
                if (includeContent) {
                    try {
                        fileInfo.content = await fs.readFile(itemPath, 'utf8');
                    } catch (error) {
                        fileInfo.content = null;
                        fileInfo.readError = error.message;
                    }
                }

                results.files.push(fileInfo);
            }
        }
    }

    await scan(dirPath);
    return results;
};

/**
 * Validate extraction safety (check for zip bombs)
 */
const validateExtractionSafety = (scanResults) => {
    const { stats } = scanResults;

    if (stats.totalFiles >= MAX_FILE_COUNT) {
        throw new Error(`Extraction contains too many files (${stats.totalFiles}). Maximum allowed: ${MAX_FILE_COUNT}`);
    }

    return true;
};

module.exports = {
    scanDirectory,
    validateExtractionSafety,
    isAllowedExtension,
    isBinaryFile,
    MAX_FILE_COUNT,
    MAX_FILE_SIZE_BYTES,
    MAX_DEPTH
};
