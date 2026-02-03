const fs = require('fs-extra');
const path = require('path');

/**
 * Find the actual project root by checking for wrapper folders
 * Many ZIPs have structure like: archive.zip -> project-name/ -> actual-files/
 */
const findProjectRoot = async (dirPath) => {
    const files = await fs.readdir(dirPath);
    console.log('📂 Files in extracted root:', files.slice(0, 20));

    // Check if current directory has project markers
    const hasProjectMarkers = files.includes('package.json') ||
        files.includes('requirements.txt') ||
        files.includes('pyproject.toml') ||
        files.includes('pom.xml') ||
        files.includes('build.gradle');

    if (hasProjectMarkers) {
        console.log('✅ Found project root at:', dirPath);
        return dirPath;
    }

    // If only one item and it's a directory, check inside it (common wrapper folder pattern)
    if (files.length === 1) {
        const singleItem = files[0];
        const singleItemPath = path.join(dirPath, singleItem);
        const stat = await fs.stat(singleItemPath);

        if (stat.isDirectory()) {
            console.log('🔍 Checking inside wrapper folder:', singleItem);
            const innerFiles = await fs.readdir(singleItemPath);
            console.log('📂 Files inside wrapper:', innerFiles.slice(0, 20));

            const hasInnerProjectMarkers = innerFiles.includes('package.json') ||
                innerFiles.includes('requirements.txt') ||
                innerFiles.includes('pyproject.toml') ||
                innerFiles.includes('pom.xml') ||
                innerFiles.includes('build.gradle');

            if (hasInnerProjectMarkers) {
                console.log('✅ Found project root inside wrapper:', singleItemPath);
                return singleItemPath;
            }

            // Check for monorepo structure (backend/frontend subdirectories)
            console.log('🔍 Checking for monorepo structure...');
            const commonSubdirs = ['backend', 'server', 'api', 'src', 'frontend', 'client'];
            for (const subdir of commonSubdirs) {
                if (innerFiles.includes(subdir)) {
                    const subdirPath = path.join(singleItemPath, subdir);
                    try {
                        const subdirStat = await fs.stat(subdirPath);
                        if (subdirStat.isDirectory()) {
                            const subdirFiles = await fs.readdir(subdirPath);
                            if (subdirFiles.includes('package.json') ||
                                subdirFiles.includes('requirements.txt') ||
                                subdirFiles.includes('pyproject.toml')) {
                                console.log(`✅ Found project in '${subdir}' subdirectory:`, subdirPath);
                                return subdirPath;
                            }
                        }
                    } catch (e) {
                        // Skip if can't access
                    }
                }
            }
        }
    }

    console.log('⚠️ Using original path as project root');
    return dirPath;
};

const detectProjectType = async (dirPath) => {
    const files = await fs.readdir(dirPath);

    if (files.includes('package.json')) {
        console.log('✅ Detected: Node.js project');
        return 'Node.js';
    }
    if (files.includes('requirements.txt') || files.includes('pyproject.toml') || files.some(f => f.endsWith('.py'))) {
        console.log('✅ Detected: Python project');
        return 'Python';
    }
    if (files.includes('pom.xml') || files.includes('build.gradle')) {
        console.log('✅ Detected: Java/Spring Boot project');
        return 'Java/Spring Boot';
    }

    console.log('⚠️ Unknown project type');
    return 'Unknown';
};

const parseNodeRef = async (dirPath, scanResults) => {
    const data = { routes: [], database: [], authentication: [], dependencies: {} };

    // Read package.json
    try {
        const pkg = await fs.readJson(path.join(dirPath, 'package.json'));
        data.dependencies = pkg.dependencies || {};

        console.log('📦 Found dependencies:', Object.keys(data.dependencies));

        // Database detection
        if (data.dependencies['mongoose'] || data.dependencies['mongodb']) data.database.push('MongoDB');
        if (data.dependencies['pg'] || data.dependencies['sequelize']) data.database.push('PostgreSQL');
        if (data.dependencies['mysql'] || data.dependencies['mysql2']) data.database.push('MySQL');
        if (data.dependencies['sqlite3'] || data.dependencies['better-sqlite3']) data.database.push('SQLite');
        if (data.dependencies['redis'] || data.dependencies['ioredis']) data.database.push('Redis');

        // Firebase detection
        if (data.dependencies['firebase'] || data.dependencies['firebase-admin']) {
            data.database.push('Firebase/Firestore');
        }

        // Authentication detection
        if (data.dependencies['jsonwebtoken']) data.authentication.push('JWT');
        if (data.dependencies['bcrypt'] || data.dependencies['bcryptjs']) data.authentication.push('Bcrypt');
        if (data.dependencies['passport']) data.authentication.push('Passport.js');
        if (data.dependencies['express-session']) data.authentication.push('Session-based');
        if (data.dependencies['oauth'] || data.dependencies['passport-oauth2']) data.authentication.push('OAuth');

        // Firebase Auth detection
        if (data.dependencies['firebase'] || data.dependencies['firebase-admin']) {
            data.authentication.push('Firebase Auth');
        }

        console.log('🔐 Detected auth:', data.authentication);
        console.log('💾 Detected database:', data.database);
    } catch (e) {
        console.error('❌ Error reading package.json:', e.message);
    }

    // Use scanned files instead of recursive scan
    const jsFiles = scanResults.files.filter(file =>
        file.extension === '.js' ||
        file.extension === '.ts' ||
        file.extension === '.jsx' ||
        file.extension === '.tsx'
    );

    console.log(`🔎 Scanning ${jsFiles.length} JS/TS files for routes...`);

    for (const file of jsFiles) {
        try {
            // Skip files larger than 1MB (already filtered by scanner, but double-check)
            if (file.size > 1024 * 1024) {
                continue;
            }

            const content = await fs.readFile(file.path, 'utf8');

            // Express routes - improved extraction
            const routeRegex = /\.(get|post|put|delete|patch)\s*\(\s*['\"`]([^'\"`]+)['\"`]/gi;
            let match;
            while ((match = routeRegex.exec(content)) !== null) {
                const method = match[1].toUpperCase();
                const route = match[2];
                data.routes.push(`${method} ${route}`);
            }
        } catch (error) {
            console.error(`Error reading file ${file.path}:`, error.message);
        }
    }

    console.log(`✅ Found ${data.routes.length} routes`);

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
                const lowerLine = line.toLowerCase();
                // Framework detection
                if (lowerLine.includes('fastapi')) data.dependencies['fastapi'] = 'detected';
                if (lowerLine.includes('flask')) data.dependencies['flask'] = 'detected';
                if (lowerLine.includes('django')) data.dependencies['django'] = 'detected';

                // Database detection
                if (lowerLine.includes('sqlalchemy')) data.database.push('SQLAlchemy');
                if (lowerLine.includes('pymongo')) data.database.push('MongoDB');
                if (lowerLine.includes('psycopg2') || lowerLine.includes('asyncpg')) data.database.push('PostgreSQL');
                if (lowerLine.includes('mysql') || lowerLine.includes('pymysql')) data.database.push('MySQL');
                if (lowerLine.includes('redis')) data.database.push('Redis');
                if (lowerLine.includes('sqlite')) data.database.push('SQLite');

                // Authentication detection
                if (lowerLine.includes('pyjwt') || lowerLine.includes('python-jose')) data.authentication.push('JWT');
                if (lowerLine.includes('passlib') || lowerLine.includes('bcrypt')) data.authentication.push('Bcrypt/Passlib');
                if (lowerLine.includes('oauth') || lowerLine.includes('authlib')) data.authentication.push('OAuth');
            });
        }
    } catch (e) { }

    // Use scanned files instead of recursive scan
    const pyFiles = scanResults.files.filter(file => file.extension === '.py');

    for (const file of pyFiles) {
        try {
            if (file.size > 1024 * 1024) continue;

            const content = await fs.readFile(file.path, 'utf8');
            // FastAPI/Flask routes - improved extraction
            const routeRegex = /@(?:app|router)\.(get|post|put|delete|patch)\s*\(\s*['"`]([^'"`]+)['"`]/gi;
            let match;
            while ((match = routeRegex.exec(content)) !== null) {
                const method = match[1].toUpperCase();
                const route = match[2];
                data.routes.push(`${method} ${route}`);
            }
        } catch (error) {
            console.error(`Error reading file ${file.path}:`, error.message);
        }
    }

    return data;
};

const parseUnknown = async () => ({ routes: [], database: [], authentication: [], dependencies: {} });

const analyzeProject = async (dirPath, scanResults) => {
    // First, find the actual project root (handles wrapper folders)
    const projectRoot = await findProjectRoot(dirPath);
    console.log('🎯 Using project root:', projectRoot);

    // Detect project type
    const type = await detectProjectType(projectRoot);

    let data = {};
    if (type === 'Node.js') data = await parseNodeRef(projectRoot, scanResults);
    else if (type === 'Python') data = await parsePythonRef(projectRoot, scanResults);
    else data = await parseUnknown(projectRoot); // Fallback or implement Java later

    // Deduplicate arrays
    data.routes = [...new Set(data.routes)];
    data.database = [...new Set(data.database)];
    data.authentication = [...new Set(data.authentication)];

    return { type, data };
};

module.exports = { analyzeProject };
