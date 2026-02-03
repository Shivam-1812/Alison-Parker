const extract = require('extract-zip');
const fs = require('fs-extra');
const path = require('path');
const safeFileScanner = require('./safeFileScanner');

/**
 * Extracts a ZIP file using streaming approach (memory-safe)
 * @param {string} zipFilePath - Path to the ZIP file
 * @param {string} destDir - Destination directory
 * @returns {Promise<string>} - Path to the extracted directory
 */
const extractZipSafe = async (zipFilePath, destDir) => {
    try {
        const extractPath = path.join(destDir, path.basename(zipFilePath, '.zip'));

        // Ensure destination exists
        await fs.ensureDir(extractPath);

        // Extract using streaming (memory-safe)
        console.log(`Extracting ZIP: ${zipFilePath} to ${extractPath}`);
        await extract(zipFilePath, { dir: path.resolve(extractPath) });

        // Validate extraction safety (check for zip bombs)
        await validateZipSafety(extractPath);

        console.log(`Extraction complete: ${extractPath}`);
        return extractPath;

    } catch (error) {
        throw new Error(`Failed to extract ZIP: ${error.message}`);
    }
};

/**
 * Validate extraction safety (prevent zip bombs)
 * @param {string} extractPath - Path to extracted files
 * @returns {Promise<boolean>} - True if safe
 */
const validateZipSafety = async (extractPath) => {
    try {
        // Quick scan to check file count and depth
        const scanResults = await safeFileScanner.scanDirectory(extractPath, {
            maxFiles: safeFileScanner.MAX_FILE_COUNT,
            maxDepth: safeFileScanner.MAX_DEPTH,
            includeContent: false
        });

        // Validate against limits
        safeFileScanner.validateExtractionSafety(scanResults);

        console.log(`Extraction validated: ${scanResults.stats.totalFiles} files, ${scanResults.stats.totalDirectories} directories`);
        return true;

    } catch (error) {
        // If validation fails, this is likely a zip bomb
        throw new Error(`Zip bomb detected or file limit exceeded: ${error.message}`);
    }
};

/**
 * Get project structure using safe file scanner
 * @param {string} dirPath - Directory to scan
 * @returns {Promise<object>} - Scan results with files and structure
 */
const getProjectStructure = async (dirPath) => {
    try {
        const scanResults = await safeFileScanner.scanDirectory(dirPath, {
            includeContent: false
        });

        console.log(`Scanned project: ${scanResults.stats.totalFiles} files, skipped ${scanResults.stats.skippedFiles} files`);

        return scanResults;

    } catch (error) {
        throw new Error(`Failed to scan project structure: ${error.message}`);
    }
};

/**
 * Deletes a file or directory (kept for backward compatibility)
 * @param {string} filePath - Path to remove
 */
const cleanup = async (filePath) => {
    try {
        await fs.remove(filePath);
        console.log(`Cleaned up: ${filePath}`);
    } catch (error) {
        console.error(`Cleanup failed for ${filePath}: ${error.message}`);
    }
};

module.exports = {
    extractZipSafe,
    validateZipSafety,
    getProjectStructure,
    cleanup,
    // Legacy export for backward compatibility
    extractZip: extractZipSafe
};
