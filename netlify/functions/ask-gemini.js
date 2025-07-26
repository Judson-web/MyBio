// netlify/functions/ask-gemini.js

// This Netlify Function is the primary "brain" for the chatbot.
// It now supports Tool Calling, allowing the AI to request real-world information.
// It receives the entire chat history and decides whether to respond with text
// or to request that a specific tool be used by the frontend.

exports.handler = async (event) => {
    if (event.httpMethod !== 'POST') {
        return {
            statusCode: 405,
            body: JSON.stringify({ message: 'Method Not Allowed' }),
            headers: { 'Allow': 'POST' }
        };
    }

    try {
        // The frontend can send either a `prompt` (for simple cases like the greeting)
        // or a full `history` array. We handle both now.
        const { history, prompt } = JSON.parse(event.body);

        if (!history && !prompt) {
            return {
                statusCode: 400,
                body: JSON.stringify({ message: 'Request body must contain either "history" or "prompt".' })
            };
        }

        // If only a prompt is provided, create a history array from it.
        const chatHistory = history || [{ role: 'user', parts: [{ text: prompt }] }];

        const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
        if (!GEMINI_API_KEY) {
            return {
                statusCode: 500,
                body: JSON.stringify({ message: 'Server configuration error: API key not found.' })
            };
        }

        // CORRECTED: The system instruction is a top-level field, not part of the contents array.
        const systemInstruction = {
            parts: [{
                text: "You are Judson's AI Assistant. You are creative, concise, and helpful. You can use tools to get real-time information. When a user asks for information that requires a tool, call the appropriate function. For general conversation, respond directly."
            }]
        };
        
        const tools = [{
            functionDeclarations: [
                {
                    name: "get_now_playing",
                    description: "Get the song currently being played by Judson on Last.fm."
                },
                {
                    name: "get_current_time",
                    description: "Get the current time in India."
                },
                {
                    name: "interpret_dream",
                    description: "Interprets a user's dream in a whimsical, non-serious way.",
                    parameters: {
                        type: "OBJECT",
                        properties: {
                            dream_description: {
                                type: "STRING",
                                description: "A description of the dream."
                            }
                        },
                        required: ["dream_description"]
                    }
                },
                {
                    name: "get_visitor_ip",
                    description: "Get the public IP address of the current website visitor."
                }
            ]
        }];

        // CORRECTED: Payload structure is now valid.
        const geminiPayload = {
            systemInstruction: systemInstruction,
            contents: chatHistory, // Use the history directly
            tools: tools
        };

        const geminiApiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${GEMINI_API_KEY}`;

        const geminiResponse = await fetch(geminiApiUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(geminiPayload)
        });

        if (!geminiResponse.ok) {
            const errorBody = await geminiResponse.text();
            console.error("Error from Gemini API:", geminiResponse.status, errorBody);
            return {
                statusCode: geminiResponse.status,
                body: JSON.stringify({ message: `Error from Gemini API: ${errorBody}` })
            };
        }

        const geminiResult = await geminiResponse.json();

        if (!geminiResult.candidates || geminiResult.candidates.length === 0) {
             return {
                statusCode: 200,
                body: JSON.stringify({ response: { role: 'model', parts: [{ text: "I'm sorry, I could not generate a response. Please try again." }] } })
            };
        }
        
        const modelResponse = geminiResult.candidates[0].content;

        return {
            statusCode: 200,
            body: JSON.stringify({ response: modelResponse })
        };

    } catch (error) {
        console.error('Netlify Function error:', error);
        return {
            statusCode: 500,
            body: JSON.stringify({ message: 'Internal Server Error', detail: error.message })
        };
    }
};
