// netlify/functions/ask-gemini.js

// This Netlify Function acts as a secure proxy for general Gemini API calls
// (e.g., for the 'ask' command in your CLI).
// It accepts a prompt and optionally a chat history, and returns a text response.

exports.handler = async (event, context) => {
    // 1. Security Check: Only allow POST requests.
    if (event.httpMethod !== 'POST') {
        return {
            statusCode: 405, // Method Not Allowed
            body: JSON.stringify({ message: 'Method Not Allowed. Only POST requests are accepted.' }),
            headers: { 'Allow': 'POST', 'Content-Type': 'application/json' }
        };
    }

    try {
        // 2. Parse the request body from your frontend.
        // It expects a 'prompt' and optionally a 'history' array.
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
        const chatHistory = [...history, { role: "user", parts: [{ text: prompt }] }];

        // 6. Prepare the payload for the actual Gemini API call.
        const geminiPayload = {
            contents: chatHistory,
            // No responseSchema here, as we want free-form text.
        };

        const geminiApiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${GEMINI_API_KEY}`;

        // 7. Make the actual API call to Google's Gemini service.
        const geminiResponse = await fetch(geminiApiUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(geminiPayload)
        });

        // 8. Handle potential errors returned by the Gemini API (e.g., 400, 500 status codes).
        if (!geminiResponse.ok) {
            const errorBody = await geminiResponse.text(); // Get raw text to avoid parsing issues
            console.error("Error from Gemini API:", geminiResponse.status, errorBody);
            return {
                statusCode: geminiResponse.status,
                body: JSON.stringify({ message: `Error from Gemini API: ${geminiResponse.status}. Detail: ${errorBody.substring(0, 200)}...` }), // Truncate detail
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
        } else {
            console.error("Unexpected API response structure or no content generated:", geminiResult);
            // Provide a fallback message if the structure is unexpected
            generatedText = "The AI did not provide a clear response. Please try again.";
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

              
