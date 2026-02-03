import React from 'react';
import { Code, Database, Lock, Box } from 'lucide-react';
import ReactMarkdown from 'react-markdown';

const ResultView = ({ data }) => {
    const { explanation, metadata } = data;

    return (
        <div className="fade-in">
            {/* Metadata Cards */}
            <div className="grid">
                <div className="card">
                    <div className="card-header text-blue">
                        <Box size={18} />
                        <h4>Project Type</h4>
                    </div>
                    <p style={{ fontSize: '0.875rem', fontWeight: 500 }}>{metadata.projectType}</p>
                </div>

                <div className="card">
                    <div className="card-header text-green">
                        <Code size={18} />
                        <h4>Routes</h4>
                    </div>
                    <p className="card-value">{metadata.technologies.routes.length}</p>
                    <p style={{ fontSize: '0.75rem', color: '#6b7280' }}>Endpoints found</p>
                </div>

                <div className="card">
                    <div className="card-header text-purple">
                        <Database size={18} />
                        <h4>Database</h4>
                    </div>
                    <div className="tag-container">
                        {metadata.technologies.database.length > 0 ? (
                            metadata.technologies.database.map((db, i) => (
                                <span key={i} className="tag tag-purple">{db}</span>
                            ))
                        ) : <span style={{ color: '#9ca3af', fontSize: '0.875rem' }}>None detected</span>}
                    </div>
                </div>

                <div className="card">
                    <div className="card-header text-red">
                        <Lock size={18} />
                        <h4>Auth</h4>
                    </div>
                    <div className="tag-container">
                        {metadata.technologies.authentication.length > 0 ? (
                            metadata.technologies.authentication.map((auth, i) => (
                                <span key={i} className="tag tag-red">{auth}</span>
                            ))
                        ) : <span style={{ color: '#9ca3af', fontSize: '0.875rem' }}>None detected</span>}
                    </div>
                </div>
            </div>

            {/* AI Explanation */}
            <div className="explanation-card">
                <h3 className="explanation-title">Architectural Analysis</h3>
                <div className="explanation-content prose">
                    <ReactMarkdown>{explanation}</ReactMarkdown>
                </div>
            </div>
        </div>
    );
};

export default ResultView;
