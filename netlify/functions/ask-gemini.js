// netlify/functions/ask-gemini.js

/**
 * This function is the primary "brain" for the chatbot.
 * It securely communicates with the Google Gemini API.
 * It now uses a more focused set of tools.
 */
exports.handler = async (event) => {
    // 1. Security Check: Only allow POST requests.
    if (event.httpMethod !== 'POST') {
        return {
            statusCode: 405,
            body: JSON.stringify({ message: 'Method Not Allowed' }),
            headers: { 'Allow': 'POST' }
        };
    }

    try {
        // 2. Parse the incoming chat history from the frontend.
        const { history, prompt } = JSON.parse(event.body);
        if (!history && !prompt) {
            return {
                statusCode: 400,
                body: JSON.stringify({ message: 'Request body must contain "history" or "prompt".' })
            };
        }

        // 3. Create a history array if only a simple prompt was sent.
        const chatHistory = history || [{ role: 'user', parts: [{ text: prompt }] }];

        // 4. Securely get the API key from environment variables.
        const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
        if (!GEMINI_API_KEY) {
            console.error("GEMINI_API_KEY environment variable not set.");
            return {
                statusCode: 500,
                body: JSON.stringify({ message: 'Server configuration error: API key not found.' })
            };
        }
        
        // 5. Define the AI's personality and instructions.
        const systemInstruction = {
            parts: [{
                text: "You are Judson's AI Assistant. You are creative, concise, and helpful. You can use tools to get real-time information about the current time in India and what music Judson is listening to. For general conversation, respond directly."
            }]
        };
        
        // 6. IMPROVEMENT: Removed non-essential tools ('interpret_dream', 'get_visitor_ip') to focus the chatbot.
        const tools = [{
            functionDeclarations: [
                {
                    name: "get_now_playing",
                    description: "Get the song currently being played by Judson on Last.fm."
                },
                {
                    name: "get_current_time",
                    description: "Get the current time in India."
                }
            ]
        }];

        // 7. Construct the payload for the Gemini API.
        const geminiPayload = {
            systemInstruction: systemInstruction,
            contents: chatHistory,
            tools: tools
        };

        // 8. IMPROVEMENT: Updated to the latest cost-effective and fast model.
        const geminiApiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-latest:generateContent?key=${GEMINI_API_KEY}`;

        // 9. Call the Gemini API.
        const geminiResponse = await fetch(geminiApiUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(geminiPayload)
        });

        // 10. Handle errors from the Gemini API.
        if (!geminiResponse.ok) {
            const errorBody = await geminiResponse.text();
            console.error("Error from Gemini API:", geminiResponse.status, errorBody);
            return {
                statusCode: geminiResponse.status,
                body: JSON.stringify({ message: "An error occurred while communicating with the AI. Please try again." })
            };
        }

        const geminiResult = await geminiResponse.json();
        
        // 11. Handle cases where the AI provides no response.
        if (!geminiResult.candidates || geminiResult.candidates.length === 0) {
             return {
                statusCode: 200, // Return a success status with a user-friendly message
                body: JSON.stringify({ response: { role: 'model', parts: [{ text: "I'm sorry, I couldn't generate a response. Please try again." }] } })
            };
        }
        
        // 12. Send the successful response back to the frontend.
        const modelResponse = geminiResult.candidates[0].content;
        return {
            statusCode: 200,
            body: JSON.stringify({ response: modelResponse })
        };

    } catch (error) {
        console.error('Netlify Function error:', error);
        return {
            statusCode: 500,
            body: JSON.stringify({ message: 'An internal server error occurred.' })
        };
    }
};