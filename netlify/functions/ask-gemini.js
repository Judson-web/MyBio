// netlify/functions/ask-gemini.js

exports.handler = async (event) => {
    if (event.httpMethod !== 'POST') {
        return { statusCode: 405, body: 'Method Not Allowed' };
    }

    try {
        const { history } = JSON.parse(event.body);
        const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

        if (!GEMINI_API_KEY) {
            console.error("GEMINI_API_KEY environment variable not set.");
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
        
        // BUG FIX: Reverted to the stable, non-streaming generateContent endpoint
        const geminiApiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-latest:generateContent?key=${GEMINI_API_KEY}`;

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
        
        const geminiResult = await geminiResponse.json();

        if (!geminiResult.candidates || geminiResult.candidates.length === 0) {
            return {
                statusCode: 200,
                body: JSON.stringify({ response: { role: 'model', parts: [{ text: "I'm sorry, I couldn't generate a response." }] } })
            };
        }
        
        const modelResponse = geminiResult.candidates[0].content;
        
        return {
            statusCode: 200,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ response: modelResponse })
        };

    } catch (error) {
        console.error('Netlify Function error:', error);
        return { statusCode: 500, body: 'Internal Server Error' };
    }
};