const axios = require('axios');

const generateExplanation = async (metadata, projectStructure) => {
    const apiKey = process.env.GEMINI_API_KEY;
    const model = 'arcee-ai/trinity-large-preview:free'; // Original working model
    const url = 'https://openrouter.ai/api/v1/chat/completions';

    const prompt = `
You are a senior software architect explaining a codebase to a new developer joining the team.
Your goal is to provide a comprehensive yet clear explanation that helps them understand the project quickly.

Project Type: ${metadata.projectType}
Technologies: ${JSON.stringify(metadata.technologies, null, 2)}
Project Structure (partial):
${JSON.stringify(projectStructure.slice(0, 50), null, 2)}

Create a detailed explanation covering these sections:

## 📋 Project Overview
- What does this project do? What problem does it solve?
- Who are the intended users?
- What is the main value proposition?

## 🏗️ Architecture & Structure
- Overall architecture pattern (REST API, MVC, Microservices, etc.)
- Is this a monorepo, monolithic app, or distributed system?
- Key folders and their responsibilities
- How components interact with each other

## 🔄 Request Flow & Logic
- Describe a complete user request journey from start to finish
- Explain the request-response cycle in detail
- How does data flow through different layers?
- Include authentication flow if present

## 🔐 Authentication & Security
- What authentication mechanism is used? (JWT, OAuth, Session-based, etc.)
- How are users authenticated and authorized?
- What security best practices are implemented?
- How are sensitive data and credentials handled?

## 💾 Database & Data Management
- What database technology is used and why?
- What kind of data is stored?
- How is data structured (models/schemas)?
- Any caching or data optimization strategies?

## 🔌 API Endpoints & Routes
- List the main API endpoints (${metadata.technologies.routes.length} detected)
- Explain what each major endpoint does
- Group endpoints by functionality (user management, data operations, etc.)
- Mention HTTP methods used (GET, POST, PUT, DELETE)

## 🧩 Key Components & Files
- Identify the most important files and folders
- Explain the purpose of each major component
- Mention any design patterns used (Repository, Factory, Singleton, etc.)
- Highlight any custom utilities or helpers

## 💻 Technology Stack Breakdown
- **Backend Framework**: What it is and why it's used
- **Database**: Technology and use case
- **Authentication**: Method and implementation
- **Key Libraries**: Important dependencies and their purposes
- **Development Tools**: Build tools, testing frameworks, etc.

## 🚀 Getting Started for New Developers
- Prerequisites (Node.js version, database setup, etc.)
- Installation steps
- Environment variables needed
- How to run the project locally
- Common commands (start, test, build)

**Writing Guidelines:**
- Use clear, beginner-friendly language
- Include specific examples where helpful
- Use bullet points and numbered lists
- Bold important terms and concepts
- Add emojis to make sections visually distinct
- Be thorough but concise - aim for clarity over brevity

Provide your response in JSON format:
{
  "explanation": "Full markdown explanation with all sections above",
  "mermaid_code": "graph TD\\nA[User] -->|HTTP Request| B[API Server]\\nB -->|Auth Check| C[Auth Service]\\nC --> B\\nB --> D[Database]\\nD -->|Data| B\\nB -->|Response| A"
}

CRITICAL FOR MERMAID DIAGRAM:
- Create a comprehensive architecture/flow diagram
- Use standard Mermaid syntax (graph TD or graph LR)
- Include: User/Client, API/Backend, Database, Authentication (if present)
- Show the complete request-response flow
- Use descriptive labels in square brackets: A["User Browser"]
- Show data flow with arrows and labels: A -->|HTTP POST| B
- Include all major components from the tech stack
- Do NOT use special characters in node IDs
- Return ONLY the mermaid code string in the "mermaid_code" field
`;

    try {
        console.log('🤖 Generating AI explanation...');
        const startTime = Date.now();

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
                "HTTP-Referer": "http://localhost:5173",
                "X-Title": "Codebase Explainer",
                "Content-Type": "application/json"
            },
            timeout: 90000 // 90 seconds
        });

        const elapsed = ((Date.now() - startTime) / 1000).toFixed(2);
        console.log(`✅ AI response received in ${elapsed}s`);

        const text = response.data.choices[0].message.content;
        // Clean markdown quotes if present
        const cleanText = text.replace(/```json/g, '').replace(/```/g, '').trim();
        return JSON.parse(cleanText);

    } catch (error) {
        console.error("❌ AI API Error:");
        console.error("Error message:", error.message);
        console.error("Error code:", error.code);
        if (error.response) {
            console.error("Response status:", error.response.status);
            console.error("Response data:", JSON.stringify(error.response.data, null, 2));
        }

        // Fallback response if AI fails
        if (error.code === 'ECONNABORTED' || error.message.includes('timeout')) {
            console.log('⚠️ AI timeout - returning basic summary');
            return {
                explanation: `# 📋 ${metadata.projectType} Project Analysis\n\n## 🏗️ Architecture\n\nThis is a **${metadata.projectType}** application with the following components:\n\n## 💾 Database\n${metadata.technologies.database.length > 0 ? metadata.technologies.database.map(db => `- **${db}**`).join('\n') : '- No database detected'}\n\n## 🔐 Authentication\n${metadata.technologies.authentication.length > 0 ? metadata.technologies.authentication.map(auth => `- **${auth}**`).join('\n') : '- No authentication detected'}\n\n## 🔌 API Endpoints (${metadata.technologies.routes.length} detected)\n\n${metadata.technologies.routes.slice(0, 15).map(route => `- \`${route}\``).join('\n')}${metadata.technologies.routes.length > 15 ? '\n- ... and more' : ''}\n\n## 💻 Key Dependencies\n\n${Object.keys(metadata.technologies.dependencies).slice(0, 15).map(dep => `- **${dep}**: ${metadata.technologies.dependencies[dep]}`).join('\n')}\n\n---\n\n*Note: AI analysis timed out. This is a basic summary based on detected metadata. Please try again for a more detailed explanation.*`,
                mermaid_code: `graph TD\n    A[User/Client] -->|HTTP Request| B[API Server]\n    B --> C{Auth Check}\n    C -->|Valid| D[${metadata.technologies.database[0] || 'Database'}]\n    C -->|Invalid| E[Error Response]\n    D -->|Data| B\n    B -->|JSON Response| A`
            };
        }

        throw new Error("Failed to generate explanation from AI");
    }
};

module.exports = { generateExplanation };
