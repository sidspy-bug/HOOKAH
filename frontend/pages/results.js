import React from 'react';
import { useState } from 'react';

const ResultsDashboard = () => {
    const [projectIdeas, setProjectIdeas] = useState([]);
    const [selectedIdea, setSelectedIdea] = useState(null);

    // Dummy data, replace with real data later
    const papers = [
        { title: 'Paper 1', domain: 'Domain A', abstract: 'Snippet A', methods: 'Method A', findings: 'Finding A', limitations: 'Limitation A' },
        { title: 'Paper 2', domain: 'Domain B', abstract: 'Snippet B', methods: 'Method B', findings: 'Finding B', limitations: 'Limitation B' }
    ];

    const contradictionsAndTrends = ['Contradiction 1', 'Trend 1', 'Contradiction 2', 'Trend 2'];
    const researchGaps = [{ severity: 'High', description: 'Gap 1' }, { severity: 'Medium', description: 'Gap 2' }];
    const rankedIdeas = [
        { name: 'Idea 1', novelty: 4, impact: 5, feasibility: 3, overall: 4 },
        { name: 'Idea 2', novelty: 5, impact: 4, feasibility: 4, overall: 4 }
    ];

    const handleExport = () => {
        // Logic to convert results to markdown and download
    };

    return (
        <div className="container mx-auto p-4">
            <h1 className="text-2xl font-bold mb-4">Research Topic: Your Topic Here</h1>

            <section className="mb-8">
                <h2 className="text-xl font-semibold">Papers</h2>
                <div className="grid grid-cols-1 gap-4">
                    {papers.map(paper => (
                        <div className="bg-white p-4 rounded shadow-md" key={paper.title}>
                            <h3 className="font-medium text-lg">{paper.title}</h3>
                            <p><strong>Domain:</strong> {paper.domain}</p>
                            <p><strong>Abstract:</strong> {paper.abstract}</p>
                            <p><strong>Methods:</strong> {paper.methods}</p>
                            <p><strong>Findings:</strong> {paper.findings}</p>
                            <p><strong>Limitations:</strong> {paper.limitations}</p>
                        </div>
                    ))}
                </div>
            </section>

            <section className="mb-8">
                <h2 className="text-xl font-semibold">Contradictions & Trends</h2>
                <ul className="list-disc pl-5">
                    {contradictionsAndTrends.map(item => (
                        <li key={item} className="mb-2">{item}</li>
                    ))}
                </ul>
            </section>

            <section className="mb-8">
                <h2 className="text-xl font-semibold">Research Gaps</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {researchGaps.map(gap => (
                        <div className={`bg-white p-4 rounded shadow-md border-l-4 ${gap.severity === 'High' ? 'border-red-500' : gap.severity === 'Medium' ? 'border-yellow-500' : 'border-green-500'}`} key={gap.description}>
                            <p className="font-medium">{gap.description}</p>
                            <span className="text-sm text-gray-500">Severity: {gap.severity}</span>
                        </div>
                    ))}
                </div>
            </section>

            <section className="mb-8">
                <h2 className="text-xl font-semibold">Ranked Project Ideas</h2>
                <table className="min-w-full border-collapse border border-gray-200">
                    <thead>
                        <tr className="bg-gray-200">
                            <th className="border border-gray-300 p-2">Idea</th>
                            <th className="border border-gray-300 p-2">Novelty</th>
                            <th className="border border-gray-300 p-2">Impact</th>
                            <th className="border border-gray-300 p-2">Feasibility</th>
                            <th className="border border-gray-300 p-2">Overall Score</th>
                        </tr>
                    </thead>
                    <tbody>
                        {rankedIdeas.map(idea => (
                            <tr key={idea.name} className="border border-gray-300">
                                <td className="border border-gray-300 p-2">{idea.name}</td>
                                <td className="border border-gray-300 p-2">{idea.novelty}</td>
                                <td className="border border-gray-300 p-2">{idea.impact}</td>
                                <td className="border border-gray-300 p-2">{idea.feasibility}</td>
                                <td className="border border-gray-300 p-2">{idea.overall}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </section>

            {selectedIdea && (
                <section className="mb-8">
                    <h2 className="text-xl font-semibold">Simulation Lab Section for {selectedIdea.name}</h2>
                    <p><strong>Problem Statement:</strong> [Statement]</p>
                    <p><strong>Approach:</strong> [Approach]</p>
                    <p><strong>Dataset:</strong> [Dataset]</p>
                    <p><strong>Baseline:</strong> [Baseline]</p>
                    <p><strong>Metrics:</strong> [Metrics]</p>
                    <p><strong>Outcomes:</strong> [Outcomes]</p>
                    <p><strong>Risks:</strong> [Risks]</p>
                </section>
            )}

            <div className="flex space-x-4">
                <button onClick={handleExport} className="bg-blue-500 text-white px-4 py-2 rounded">Export</button>
                <button className="bg-gray-500 text-white px-4 py-2 rounded">Back to Landing Page</button>
            </div>
        </div>
    );
};

export default ResultsDashboard;