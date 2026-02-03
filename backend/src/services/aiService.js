const axios = require('axios');

const generateExplanation = async (metadata, projectStructure) => {
    const apiKey = process.env.GEMINI_API_KEY; // Using the key provided for OpenRouter
    const model = 'arcee-ai/trinity-large-preview:free'; // OpenRouter model ID
    const url = 'https://openrouter.ai/api/v1/chat/completions';

    const prompt = `
You are a senior software architect.
Explain this project for a new developer.
Describe:
- Overall architecture
- Request flow
- Authentication mechanism
- Database usage
- Important components

Project Type: ${metadata.projectType}
Technologies: ${JSON.stringify(metadata.technologies, null, 2)}
Project Structure (partial):
${JSON.stringify(projectStructure.slice(0, 50), null, 2)}... (truncated)

Provide your response in JSON format:
{
  "explanation": "Markdown text here. Use headers, bold text, and lists.",
  "mermaid_code": "graph TD;\nClient[Client Browser] -->|HTTP| API[Backend API];\nAPI --> DB[(Database)];\n..."
}

CRITICAL FOR MERMAID:
- Use standard Mermaid syntax (graph TD).
- If node names have spaces, enclose them in square brackets and quotes, e.g., A["Client Browser"].
- Do NOT use special characters in IDs.
- Return ONLY the mermaid code string in the "mermaid_code" field.
`;

    try {
        const response = await axios.post(url, {
            model: model,
            messages: [
                {
                    role: "user",
                    content: prompt
                }
            ],
            response_format: { type: "json_object" }
        }, {
            headers: {
                "Authorization": `Bearer ${apiKey}`,
                "HTTP-Referer": "http://localhost:5173", // Optional, for OpenRouter rankings
                "X-Title": "Codebase Explainer", // Optional
                "Content-Type": "application/json"
            }
        });

        const text = response.data.choices[0].message.content;
        // Clean markdown quotes if present
        const cleanText = text.replace(/```json/g, '').replace(/```/g, '').trim();
        return JSON.parse(cleanText);

    } catch (error) {
        console.error("AI API Error:", error.response ? error.response.data : error.message);
        throw new Error("Failed to generate explanation from AI");
    }
};

module.exports = { generateExplanation };
