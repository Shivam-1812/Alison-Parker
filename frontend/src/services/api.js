import axios from 'axios';

const api = axios.create({
    baseURL: '/api', // Proxy handles this
    timeout: 60000, // 1 minute timeout for AI processing
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
