// netlify/functions/ask-gemini.js

// This is required for streaming responses in Netlify Functions
const { Readable } = require('stream');

exports.handler = async (event) => {
    if (event.httpMethod !== 'POST') {
        return { statusCode: 405, body: 'Method Not Allowed' };
    }

    try {
        const { history } = JSON.parse(event.body);
        const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

        if (!GEMINI_API_KEY) {
            return { statusCode: 500, body: 'API key not found.' };
        }

        const systemInstruction = {
            parts: [{ text: "You are Judson's AI Assistant. You are creative, concise, and helpful. You can use tools for real-time info. For general conversation, respond directly." }]
        };
        const tools = [{ functionDeclarations: [{ name: "get_now_playing", description: "Get the song currently being played by Judson on Last.fm." }, { name: "get_current_time", description: "Get the current time in India." }] }];
        
        const geminiPayload = {
            systemInstruction: systemInstruction,
            contents: history,
            tools: tools
        };
        
        // IMPORTANT: The endpoint is now streamGenerateContent
        const geminiApiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-latest:streamGenerateContent?key=${GEMINI_API_KEY}&alt=sse`;

        const geminiResponse = await fetch(geminiApiUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(geminiPayload)
        });

        if (!geminiResponse.ok) {
            const errorBody = await geminiResponse.text();
            console.error("Error from Gemini API:", errorBody);
            return { statusCode: geminiResponse.status, body: `Error from Gemini API: ${errorBody}` };
        }
        
        // This sets up the streaming response back to the client
        const readable = new Readable({
            async read() {
                const reader = geminiResponse.body.getReader();
                try {
                    while (true) {
                        const { done, value } = await reader.read();
                        if (done) {
                            this.push(null); // End the stream
                            break;
                        }
                        
                        // Process Server-Sent Events (SSE) from Gemini
                        const chunk = new TextDecoder().decode(value);
                        const lines = chunk.split('\n');
                        for (const line of lines) {
                            if (line.startsWith('data: ')) {
                                const jsonStr = line.substring(6);
                                try {
                                    const parsed = JSON.parse(jsonStr);
                                    const text = parsed.candidates[0]?.content?.parts[0]?.text;
                                    if (text) {
                                        this.push(text); // Push only the text content to the client
                                    }
                                } catch (e) {
                                    // Ignore lines that are not valid JSON
                                }
                            }
                        }
                    }
                } catch (error) {
                    this.destroy(error);
                } finally {
                    reader.releaseLock();
                }
            }
        });

        return {
            statusCode: 200,
            headers: { 'Content-Type': 'text/plain; charset=UTF-8' },
            isBase64Encoded: false,
            body: readable,
        };

    } catch (error) {
        console.error('Netlify Function error:', error);
        return { statusCode: 500, body: 'Internal Server Error' };
    }
};