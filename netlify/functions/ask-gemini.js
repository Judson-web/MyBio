// netlify/functions/ask-gemini.js

// This Netlify Function acts as a secure proxy for general Gemini API calls
// (e.g., for the 'ask' command in your CLI).
// It accepts a prompt and optionally a chat history, and returns a text response.

exports.handler = async (event, context) => {
    // 1. Security Check: Only allow POST requests.
    // Your frontend will send a POST request to this function.
    if (event.httpMethod !== 'POST') {
        return {
            statusCode: 405, // Method Not Allowed
            body: JSON.stringify({ message: 'Method Not Allowed. Only POST requests are accepted.' }),
            headers: { 'Allow': 'POST', 'Content-Type': 'application/json' }
        };
    }

    try {
        // 2. Parse the request body from your frontend.
        // It expects a 'prompt' and optionally a 'history' array (for conversational context).
        const { prompt, history = [] } = JSON.parse(event.body);

        // 3. Validate the input.
        if (!prompt) {
            return {
                statusCode: 400, // Bad Request
                body: JSON.stringify({ message: 'Prompt is required in the request body.' }),
                headers: { 'Content-Type': 'application/json' }
            };
        }

        // 4. Securely retrieve your NEW Gemini API key from Netlify Environment Variables.
        // This is the CRITICAL security step. The key is stored on Netlify's servers,
        // and is NEVER exposed to your public client-side code.
        const GEMINI_API_KEY = process.env.GEMINI_API_KEY; // This MUST match the key name you set in Netlify settings

        if (!GEMINI_API_KEY) {
            console.error("GEMINI_API_KEY environment variable is not set in Netlify.");
            return {
                statusCode: 500, // Internal Server Error
                body: JSON.stringify({ message: 'Server configuration error: Gemini API key not found.' }),
                headers: { 'Content-Type': 'application/json' }
            };
        }

        // 5. Construct the chat history for the Gemini API.
        // The 'history' array from the client should already be in the correct format
        // (e.g., [{ role: "user", parts: [{ text: "..." }] }, { role: "model", parts: [{ text: "..." }] }]).
        // We append the current user prompt to this history.
        const chatHistory = [...history, { role: "user", parts: [{ text: prompt }] }];

        // 6. Prepare the payload for the actual Gemini API call.
        // We're using the gemini-2.0-flash model. No specific responseSchema here,
        // as we want a free-form text response for general questions.
        const geminiPayload = {
            contents: chatHistory,
            // You can add other generationConfig options here if desired,
            // e.g., temperature, topP, topK, but do NOT add responseMimeType/responseSchema
            // if you want plain text.
        };

        const geminiApiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${GEMINI_API_KEY}`;

        // 7. Make the actual API call to Google's Gemini service.
        const geminiResponse = await fetch(geminiApiUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(geminiPayload)
        });

        // 8. Handle potential errors returned by the Gemini API.
        if (!geminiResponse.ok) {
            const errorData = await geminiResponse.json();
            console.error("Error from Gemini API:", errorData);
            return {
                statusCode: geminiResponse.status,
                body: JSON.stringify({ message: errorData.error.message || 'Error from Gemini API' }),
                headers: { 'Content-Type': 'application/json' }
            };
        }

        // 9. Parse the successful response from the Gemini API.
        const geminiResult = await geminiResponse.json();

        // 10. Extract the generated text.
        let generatedText = "No content generated or unexpected response structure.";
        if (geminiResult.candidates && geminiResult.candidates.length > 0 &&
            geminiResult.candidates[0].content && geminiResult.candidates[0].content.parts &&
            geminiResult.candidates[0].content.parts.length > 0) {
            generatedText = geminiResult.candidates[0].content.parts[0].text;
        }

        // 11. Send the generated text back to your client-side frontend.
        // The client will expect a JSON object with a 'response' key.
        return {
            statusCode: 200, // OK
            body: JSON.stringify({ response: generatedText }),
            headers: { 'Content-Type': 'application/json' }
        };

    } catch (error) {
        // 12. Catch any unexpected errors that occur within this Netlify Function.
        console.error('Netlify Function error:', error);
        return {
            statusCode: 500, // Internal Server Error
            body: JSON.stringify({ message: 'Internal Server Error', detail: error.message }),
            headers: { 'Content-Type': 'application/json' }
        };
    }
};

                                      
