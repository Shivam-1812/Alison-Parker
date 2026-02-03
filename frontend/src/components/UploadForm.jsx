import React, { useState } from 'react';
import { Upload, File, Loader2, Github } from 'lucide-react';
import { analyzeProject, analyzeGitHubRepo } from '../services/api';

const UploadForm = ({ onAnalysisComplete }) => {
    const [activeTab, setActiveTab] = useState('zip'); // 'zip' or 'github'
    const [file, setFile] = useState(null);
    const [githubUrl, setGithubUrl] = useState('');
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

    const handleZipUpload = async () => {
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

    const handleGitHubAnalyze = async () => {
        if (!githubUrl.trim()) {
            setError('Please enter a GitHub repository URL');
            return;
        }

        // Basic GitHub URL validation
        const githubPattern = /^https?:\/\/(www\.)?github\.com\/[\w-]+\/[\w.-]+\/?$/;
        if (!githubPattern.test(githubUrl.trim())) {
            setError('Please enter a valid GitHub repository URL (e.g., https://github.com/username/repo)');
            return;
        }

        setLoading(true);
        setError('');

        try {
            const result = await analyzeGitHubRepo(githubUrl.trim());
            console.log('GitHub analysis result:', result);
            onAnalysisComplete(result);
        } catch (err) {
            console.error('GitHub analysis error:', err);
            setError(err.response?.data?.details || err.message || 'GitHub analysis failed. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const handleTabChange = (tab) => {
        setActiveTab(tab);
        setError('');
        setFile(null);
        setGithubUrl('');
    };

    return (
        <div className="upload-card">
            {/* Tab Selector */}
            <div style={{
                display: 'flex',
                gap: '0.5rem',
                marginBottom: '1.5rem',
                borderBottom: '2px solid #e5e7eb'
            }}>
                <button
                    onClick={() => handleTabChange('zip')}
                    style={{
                        flex: 1,
                        padding: '0.75rem 1rem',
                        fontSize: '0.95rem',
                        fontWeight: 600,
                        border: 'none',
                        background: 'transparent',
                        color: activeTab === 'zip' ? '#3b82f6' : '#6b7280',
                        borderBottom: activeTab === 'zip' ? '3px solid #3b82f6' : '3px solid transparent',
                        cursor: 'pointer',
                        transition: 'all 0.2s',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '0.5rem'
                    }}
                    disabled={loading}
                >
                    <Upload size={18} />
                    Upload ZIP
                </button>
                <button
                    onClick={() => handleTabChange('github')}
                    style={{
                        flex: 1,
                        padding: '0.75rem 1rem',
                        fontSize: '0.95rem',
                        fontWeight: 600,
                        border: 'none',
                        background: 'transparent',
                        color: activeTab === 'github' ? '#3b82f6' : '#6b7280',
                        borderBottom: activeTab === 'github' ? '3px solid #3b82f6' : '3px solid transparent',
                        cursor: 'pointer',
                        transition: 'all 0.2s',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '0.5rem'
                    }}
                    disabled={loading}
                >
                    <Github size={18} />
                    GitHub URL
                </button>
            </div>

            {/* ZIP Upload Tab */}
            {activeTab === 'zip' && (
                <>
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
                                    onClick={handleZipUpload}
                                    disabled={loading}
                                    className="btn btn-primary"
                                >
                                    {loading && <Loader2 className="animate-spin" style={{ width: '16px', height: '16px' }} />}
                                    {loading ? 'Analyzing...' : 'Analyze'}
                                </button>
                            </div>
                        </div>
                    )}
                </>
            )}

            {/* GitHub URL Tab */}
            {activeTab === 'github' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                        <label
                            htmlFor="github-url"
                            style={{
                                fontSize: '0.875rem',
                                fontWeight: 500,
                                color: '#374151'
                            }}
                        >
                            GitHub Repository URL
                        </label>
                        <input
                            id="github-url"
                            type="text"
                            value={githubUrl}
                            onChange={(e) => setGithubUrl(e.target.value)}
                            placeholder="https://github.com/username/repository"
                            disabled={loading}
                            style={{
                                padding: '0.75rem 1rem',
                                fontSize: '0.95rem',
                                border: '2px solid #e5e7eb',
                                borderRadius: '8px',
                                outline: 'none',
                                transition: 'border-color 0.2s',
                            }}
                            onFocus={(e) => e.target.style.borderColor = '#3b82f6'}
                            onBlur={(e) => e.target.style.borderColor = '#e5e7eb'}
                        />
                        <span style={{ fontSize: '0.75rem', color: '#6b7280' }}>
                            Enter a public GitHub repository URL to analyze
                        </span>
                    </div>

                    <button
                        onClick={handleGitHubAnalyze}
                        disabled={loading || !githubUrl.trim()}
                        className="btn btn-primary"
                        style={{
                            width: '100%',
                            padding: '0.875rem',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '0.5rem'
                        }}
                    >
                        {loading && <Loader2 className="animate-spin" style={{ width: '16px', height: '16px' }} />}
                        {loading ? 'Analyzing Repository...' : 'Analyze Repository'}
                    </button>
                </div>
            )}

            {error && <p className="error-msg">{error}</p>}
        </div>
    );
};

export default UploadForm;
