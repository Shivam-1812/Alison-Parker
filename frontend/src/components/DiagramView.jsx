import React, { useEffect, useRef, useState } from 'react';
import mermaid from 'mermaid';

const DiagramView = ({ description }) => {
    const chartRef = useRef(null);
    const [error, setError] = useState(null);

    useEffect(() => {
        mermaid.initialize({
            startOnLoad: false,
            theme: 'default',
            securityLevel: 'loose',
            fontFamily: 'Inter, sans-serif',
        });
    }, []);

    useEffect(() => {
        const renderDiagram = async () => {
            if (!description || !chartRef.current) return;

            try {
                setError(null);
                chartRef.current.innerHTML = 'Rendering diagram...';

                // Clean the mermaid code
                const cleanedCode = description.trim();

                console.log('Rendering Mermaid diagram with code:', cleanedCode);

                // Generate unique ID for each render
                const id = `mermaid-${Date.now()}`;

                const { svg } = await mermaid.render(id, cleanedCode);

                if (chartRef.current) {
                    chartRef.current.innerHTML = svg;
                }
            } catch (e) {
                console.error('Mermaid rendering error:', e);
                setError(e.message || 'Failed to render diagram');
                if (chartRef.current) {
                    chartRef.current.innerHTML = `
                        <div style="color: #ef4444; padding: 1rem; text-align: center;">
                            <p style="font-weight: 600; margin-bottom: 0.5rem;">Could not render diagram</p>
                            <p style="font-size: 0.875rem; color: #6b7280;">${e.message || 'Invalid Mermaid syntax'}</p>
                        </div>
                    `;
                }
            }
        };

        renderDiagram();
    }, [description]);

    if (!description) return null;

    return (
        <div className="diagram-card fade-in">
            <h3 className="diagram-title">Architecture Diagram</h3>
            <div className="diagram-container">
                <div ref={chartRef} style={{ width: '100%' }}>
                    Loading diagram...
                </div>
            </div>
        </div>
    );
};

export default DiagramView;
