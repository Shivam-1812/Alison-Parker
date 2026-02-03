const fs = require('fs-extra');
const path = require('path');

const detectProjectType = async (dirPath) => {
    const files = await fs.readdir(dirPath);
    if (files.includes('package.json')) return 'Node.js';
    if (files.includes('requirements.txt') || files.includes('pyproject.toml') || files.some(f => f.endsWith('.py'))) return 'Python';
    if (files.includes('pom.xml') || files.includes('build.gradle')) return 'Java/Spring Boot';
    return 'Unknown';
};

const parseNodeRef = async (dirPath, scanResults) => {
    const data = { routes: [], database: [], authentication: [], dependencies: {} };

    // Read package.json
    try {
        const pkg = await fs.readJson(path.join(dirPath, 'package.json'));
        data.dependencies = pkg.dependencies || {};

        if (data.dependencies['mongoose'] || data.dependencies['mongodb']) data.database.push('MongoDB');
        if (data.dependencies['pg'] || data.dependencies['sequelize']) data.database.push('PostgreSQL');
        if (data.dependencies['jsonwebtoken']) data.authentication.push('JWT');
        if (data.dependencies['bcrypt'] || data.dependencies['bcryptjs']) data.authentication.push('Bcrypt');
    } catch (e) { }

    // Use scanned files instead of recursive scan
    const jsFiles = scanResults.files.filter(file =>
        file.extension === '.js' ||
        file.extension === '.ts' ||
        file.extension === '.jsx' ||
        file.extension === '.tsx'
    );

    for (const file of jsFiles) {
        try {
            // Skip files larger than 1MB (already filtered by scanner, but double-check)
            if (file.size > 1024 * 1024) {
                continue;
            }

            const content = await fs.readFile(file.path, 'utf8');

            // Express routes
            const routeMatches = content.match(/\.(get|post|put|delete|patch)\s*\(['\"`]([^'\"`]+)['\"`]/g);
            if (routeMatches) {
                routeMatches.forEach(match => {
                    const clean = match.replace(/['\"`]/g, '').replace(/\s+/g, '');
                    data.routes.push(clean);
                });
            }
        } catch (error) {
            console.error(`Error reading file ${file.path}:`, error.message);
        }
    }

    return data;
};

const parsePythonRef = async (dirPath, scanResults) => {
    const data = { routes: [], database: [], authentication: [], dependencies: {} };
    // Check requirements.txt
    try {
        if (await fs.pathExists(path.join(dirPath, 'requirements.txt'))) {
            const reqs = await fs.readFile(path.join(dirPath, 'requirements.txt'), 'utf8');
            const lines = reqs.split('\n');
            lines.forEach(line => {
                if (line.includes('fastapi')) data.dependencies['fastapi'] = 'detected';
                if (line.includes('flask')) data.dependencies['flask'] = 'detected';
                if (line.includes('django')) data.dependencies['django'] = 'detected';
                if (line.includes('sqlalchemy')) data.database.push('SQLAlchemy');
                if (line.includes('pymongo')) data.database.push('MongoDB');
            });
        }
    } catch (e) { }

    // Use scanned files instead of recursive scan
    const pyFiles = scanResults.files.filter(file => file.extension === '.py');

    for (const file of pyFiles) {
        try {
            if (file.size > 1024 * 1024) continue;

            const content = await fs.readFile(file.path, 'utf8');
            // FastAPI/Flask routes
            const routeMatches = content.match(/@(app|router)\.(get|post|put|delete|patch)\s*\(['"`]([^'"`]+)['"`]/g);
            if (routeMatches) {
                routeMatches.forEach(match => {
                    data.routes.push(match);
                });
            }
        } catch (error) {
            console.error(`Error reading file ${file.path}:`, error.message);
        }
    }

    return data;
};

const parseUnknown = async () => ({ routes: [], database: [], authentication: [], dependencies: {} });

const analyzeProject = async (dirPath, scanResults) => {
    const type = await detectProjectType(dirPath);
    let data = {};
    if (type === 'Node.js') data = await parseNodeRef(dirPath, scanResults);
    else if (type === 'Python') data = await parsePythonRef(dirPath, scanResults);
    else data = await parseUnknown(dirPath); // Fallback or implement Java later

    return { type, data };
};

module.exports = { analyzeProject };
