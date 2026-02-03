/**
 * Builds a structured metadata object from the analysis results.
 */
const buildMetadata = (projectType, structure, projectData) => {
    return {
        projectType,
        structure,
        technologies: {
            routes: projectData.routes || [],
            database: projectData.database || [],
            authentication: projectData.authentication || [],
            dependencies: projectData.dependencies || {} // from package.json
        },
        entryPoint: projectData.entryPoint || 'Unknown'
    };
};

module.exports = { buildMetadata };
