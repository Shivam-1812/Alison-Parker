import React, { useState } from 'react';
import { Upload, File, Loader2 } from 'lucide-react';
import { analyzeProject } from '../services/api';

const UploadForm = ({ onAnalysisComplete }) => {
    const [file, setFile] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const handleFileChange = (e) => {
        const selected = e.target.files[0];
        if (selected && selected.name.endsWith('.zip')) {
            setFile(selected);
            setError('');
        } else {
            setError('Please upload a valid .zip file');
            setFile(null);
        }
    };

    const handleUpload = async () => {
        if (!file) return;

        setLoading(true);
        setError('');

        try {
            const result = await analyzeProject(file);
            console.log('Analysis result:', result);
            onAnalysisComplete(result);
        } catch (err) {
            console.error('Analysis error:', err);
            setError(err.message || 'Analysis failed. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="upload-card">
            <input
                type="file"
                id="zip-upload"
                style={{ display: 'none' }}
                accept=".zip"
                onChange={handleFileChange}
            />

            {!file ? (
                <label htmlFor="zip-upload" className="upload-label">
                    <Upload className="upload-icon" />
                    <span style={{ fontSize: '1rem', fontWeight: 500, color: '#111827' }}>
                        Click to upload project (.zip)
                    </span>
                    <span style={{ fontSize: '0.875rem', color: '#6b7280' }}>
                        Max 10MB
                    </span>
                </label>
            ) : (
                <div className="file-info">
                    <File className="upload-icon" style={{ color: '#10b981' }} />
                    <span style={{ fontSize: '1rem', fontWeight: 500 }}>{file.name}</span>

                    <div className="actions">
                        <button
                            onClick={() => setFile(null)}
                            className="btn btn-secondary"
                            disabled={loading}
                        >
                            Change
                        </button>
                        <button
                            onClick={handleUpload}
                            disabled={loading}
                            className="btn btn-primary"
                        >
                            {loading && <Loader2 className="animate-spin" style={{ width: '16px', height: '16px' }} />}
                            {loading ? 'Analyzing...' : 'Analyze'}
                        </button>
                    </div>
                </div>
            )}

            {error && <p className="error-msg">{error}</p>}
        </div>
    );
};

export default UploadForm;
