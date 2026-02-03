const simpleGit = require('simple-git');
const fs = require('fs-extra');
const path = require('path');

// Configuration
const GITHUB_CLONE_TIMEOUT = parseInt(process.env.GITHUB_CLONE_TIMEOUT_MS) || 60000;
const MAX_REPO_SIZE_BYTES = (parseInt(process.env.MAX_REPO_SIZE_MB) || 100) * 1024 * 1024;

/**
 * Validate GitHub URL format
 * @param {string} url - URL to validate
 * @returns {boolean} - True if valid GitHub URL
 */
const validateGitHubUrl = (url) => {
    if (!url || typeof url !== 'string') {
        return false;
    }

    // Allowed GitHub URL patterns
    const githubPatterns = [
        /^https:\/\/github\.com\/[\w-]+\/[\w.-]+(?:\.git)?$/,
        /^git@github\.com:[\w-]+\/[\w.-]+(?:\.git)?$/,
    ];

    return githubPatterns.some(pattern => pattern.test(url.trim()));
};

/**
 * Sanitize GitHub URL to prevent command injection
 * @param {string} url - URL to sanitize
 * @returns {string} - Sanitized URL
 */
const sanitizeUrl = (url) => {
    // Remove any potentially dangerous characters
    // Only allow alphanumeric, dots, hyphens, underscores, slashes, colons, @
    const sanitized = url.trim().replace(/[^a-zA-Z0-9.\-_/:@]/g, '');
    return sanitized;
};

/**
 * Calculate directory size recursively
 * @param {string} dirPath - Directory path
 * @returns {Promise<number>} - Total size in bytes
 */
const getDirectorySize = async (dirPath) => {
    let totalSize = 0;

    async function calculateSize(directory) {
        const items = await fs.readdir(directory, { withFileTypes: true });

        for (const item of items) {
            const itemPath = path.join(directory, item.name);

            if (item.isDirectory()) {
                await calculateSize(itemPath);
            } else if (item.isFile()) {
                const stats = await fs.stat(itemPath);
                totalSize += stats.size;
            }
        }
    }

    await calculateSize(dirPath);
    return totalSize;
};

/**
 * Clone a GitHub repository with safety measures
 * @param {string} repoUrl - GitHub repository URL
 * @param {string} destPath - Destination path for clone
 * @returns {Promise<object>} - Clone result with metadata
 */
const cloneRepository = async (repoUrl, destPath) => {
    // Validate URL
    if (!validateGitHubUrl(repoUrl)) {
        throw new Error('Invalid GitHub URL. Only github.com repositories are supported.');
    }

    // Sanitize URL
    const sanitizedUrl = sanitizeUrl(repoUrl);

    // Ensure destination directory exists
    await fs.ensureDir(destPath);

    // Initialize git with timeout
    const git = simpleGit({
        timeout: {
            block: GITHUB_CLONE_TIMEOUT
        }
    });

    try {
        // Perform shallow clone (depth=1) to minimize download size
        console.log(`Cloning repository: ${sanitizedUrl}`);
        await git.clone(sanitizedUrl, destPath, ['--depth', '1']);

        // Check repository size
        const repoSize = await getDirectorySize(destPath);
        console.log(`Repository size: ${(repoSize / 1024 / 1024).toFixed(2)} MB`);

        if (repoSize > MAX_REPO_SIZE_BYTES) {
            // Cleanup and throw error
            await fs.remove(destPath);
            throw new Error(
                `Repository size (${(repoSize / 1024 / 1024).toFixed(2)} MB) exceeds maximum allowed size (${process.env.MAX_REPO_SIZE_MB || 100} MB)`
            );
        }

        return {
            success: true,
            path: destPath,
            size: repoSize,
            url: sanitizedUrl
        };

    } catch (error) {
        // Cleanup on failure
        await fs.remove(destPath);

        // Handle specific error types
        if (error.message.includes('timeout')) {
            throw new Error('Repository clone timed out. The repository may be too large or network is slow.');
        }

        if (error.message.includes('Repository not found') || error.message.includes('authentication')) {
            throw new Error('Repository not found or is private. Please ensure the repository is public and the URL is correct.');
        }

        // Re-throw with context
        throw new Error(`Failed to clone repository: ${error.message}`);
    }
};

/**
 * Extract repository name from URL
 * @param {string} repoUrl - GitHub repository URL
 * @returns {string} - Repository name
 */
const getRepositoryName = (repoUrl) => {
    const match = repoUrl.match(/\/([^/]+?)(?:\.git)?$/);
    return match ? match[1] : 'unknown-repo';
};

module.exports = {
    validateGitHubUrl,
    sanitizeUrl,
    cloneRepository,
    getDirectorySize,
    getRepositoryName,
    GITHUB_CLONE_TIMEOUT,
    MAX_REPO_SIZE_BYTES
};
