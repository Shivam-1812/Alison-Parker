const fs = require('fs-extra');
const path = require('path');

// Configuration
const TEMP_FILE_MAX_AGE = parseInt(process.env.TEMP_FILE_MAX_AGE_MS) || 3600000; // 1 hour default

/**
 * Clean up a single file or directory
 * @param {string} filePath - Path to delete
 * @returns {Promise<boolean>} - True if successful
 */
const cleanupPath = async (filePath) => {
    if (!filePath) {
        return false;
    }

    try {
        const exists = await fs.pathExists(filePath);
        if (!exists) {
            return true; // Already cleaned up
        }

        await fs.remove(filePath);
        console.log(`Cleaned up: ${filePath}`);
        return true;

    } catch (error) {
        console.error(`Cleanup failed for ${filePath}:`, error.message);
        return false;
    }
};

/**
 * Clean up multiple paths
 * @param {string[]} paths - Array of paths to delete
 * @returns {Promise<object>} - Cleanup results
 */
const cleanupMultiple = async (paths) => {
    const results = {
        success: [],
        failed: []
    };

    for (const filePath of paths) {
        const success = await cleanupPath(filePath);
        if (success) {
            results.success.push(filePath);
        } else {
            results.failed.push(filePath);
        }
    }

    return results;
};

/**
 * Clean up old temporary files in a directory
 * @param {string} dirPath - Directory to clean
 * @param {number} maxAge - Maximum age in milliseconds
 * @returns {Promise<object>} - Cleanup results
 */
const cleanupOldTempFiles = async (dirPath, maxAge = TEMP_FILE_MAX_AGE) => {
    const results = {
        cleaned: [],
        kept: [],
        errors: []
    };

    try {
        const exists = await fs.pathExists(dirPath);
        if (!exists) {
            return results;
        }

        const items = await fs.readdir(dirPath, { withFileTypes: true });
        const now = Date.now();

        for (const item of items) {
            const itemPath = path.join(dirPath, item.name);

            try {
                const stats = await fs.stat(itemPath);
                const age = now - stats.mtimeMs;

                if (age > maxAge) {
                    // File/directory is old enough to clean
                    await fs.remove(itemPath);
                    results.cleaned.push(itemPath);
                    console.log(`Cleaned old temp file: ${itemPath} (age: ${Math.round(age / 1000 / 60)} minutes)`);
                } else {
                    results.kept.push(itemPath);
                }

            } catch (error) {
                results.errors.push({ path: itemPath, error: error.message });
                console.error(`Error processing ${itemPath}:`, error.message);
            }
        }

    } catch (error) {
        console.error(`Error cleaning temp directory ${dirPath}:`, error.message);
    }

    return results;
};

/**
 * Ensure cleanup happens even if there's an error
 * Wrapper for cleanup operations in try-finally blocks
 * @param {Function} operation - Async operation to perform
 * @param {string[]} cleanupPaths - Paths to clean up after operation
 * @returns {Promise<any>} - Result of operation
 */
const withCleanup = async (operation, cleanupPaths) => {
    try {
        return await operation();
    } finally {
        // Always cleanup, even on error
        await cleanupMultiple(cleanupPaths);
    }
};

module.exports = {
    cleanupPath,
    cleanupMultiple,
    cleanupOldTempFiles,
    withCleanup,
    TEMP_FILE_MAX_AGE
};
