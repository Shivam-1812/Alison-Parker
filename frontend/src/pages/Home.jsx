import React, { useState } from 'react';
import UploadForm from '../components/UploadForm';
import ResultView from '../components/ResultView';
import DiagramView from '../components/DiagramView';
import { Bot } from 'lucide-react';

const Home = () => {
    const [result, setResult] = useState(null);

    const handleAnalysisComplete = (data) => {
        console.log('Analysis complete, data received:', data);
        setResult(data);
    };

    return (
        <div className="container">
            <div className="header">
                <div className="logo-wrapper">
                    <div className="logo-circle">
                        <Bot />
                    </div>
                </div>
                <h1>Codebase Explainer</h1>
                <p className="subtitle">
                    Upload your project zip and get an instant AI-powered architectural overview and diagram.
                </p>
            </div>

            <UploadForm onAnalysisComplete={handleAnalysisComplete} />

            {result && (
                <>
                    <ResultView data={result} />
                    <DiagramView description={result.diagramDescription} />
                </>
            )}
        </div>
    );
};

export default Home;
