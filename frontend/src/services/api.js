import axios from 'axios';

const api = axios.create({
    baseURL: '/api', // Proxy handles this
    timeout: 120000, // 2 minutes timeout for AI processing
});

export const analyzeProject = async (file) => {
    const formData = new FormData();
    formData.append('projectZip', file);

    const response = await api.post('/analyze/zip', formData, {
        headers: {
            'Content-Type': 'multipart/form-data',
        },
    });
    return response.data;
};

export const analyzeGitHubRepo = async (repoUrl) => {
    const response = await api.post('/analyze/github', { repoUrl });
    return response.data;
};
