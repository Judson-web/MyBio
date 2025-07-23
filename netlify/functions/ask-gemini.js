// netlify/functions/generate-thought.js

// This function acts as a secure proxy for your Gemini API calls
// specifically for generating structured blog post thoughts.
// Your Gemini API key is stored securely as an environment variable on Netlify,
// and is never exposed to your client-side code.

exports.handler = async (event, context) => {
    // 1. Security Check: Only allow POST requests from your frontend.
    if (event.httpMethod !== 'POST') {
        return {
            statusCode: 405, // Method Not Allowed
            body: JSON.stringify({ message: 'Method Not Allowed. Only POST requests are accepted.' }),
            headers: { 'Allow': 'POST', 'Content-Type': 'application/json' }
        };
    }

    try {
        // 2. Parse the request body sent from your frontend.
        // It expects a JSON object with a 'prompt' field.
        const { prompt } = JSON.parse(event.body);

        // 3. Validate the input.
        if (!prompt) {
            return {
                statusCode: 400, // Bad Request
                body: JSON.stringify({ message: 'Prompt is required in the request body.' }),
                headers: { 'Content-Type': 'application/json' }
            };
        }

        // 4. Securely retrieve your NEW Gemini API key from Netlify Environment Variables.
        // This is the CRITICAL security step. The key is stored on Netlify's servers.
        const GEMINI_API_KEY = process.env.GEMINI_API_KEY; // This MUST match the key name in Netlify settings

        if (!GEMINI_API_KEY) {
            console.error("GEMINI_API_KEY environment variable is not set in Netlify.");
            return {
                statusCode: 500, // Internal Server Error
                body: JSON.stringify({ message: 'Server configuration error: Gemini API key not found.' }),
                headers: { 'Content-Type': 'application/json' }
            };
        }

        // 5. Prepare the payload for the actual Gemini API call.
        // We're using the gemini-2.0-flash model and requesting a JSON response.
        const geminiPayload = {
            contents: [{ role: "user", parts: [{ text: prompt }] }],
            generationConfig: {
                responseMimeType: "application/json",
                responseSchema: {
                    type: "OBJECT",
                    properties: {
                        "title": { "type": "STRING" },
                        "snippet": { "type": "STRING" }
                    },
                    required: ["title", "snippet"]
                }
            }
        };

        const geminiApiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${GEMINI_API_KEY}`;

        // 6. Make the actual API call to Google's Gemini service.
        const geminiResponse = await fetch(geminiApiUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(geminiPayload)
        });

        // 7. Handle potential errors returned by the Gemini API (e.g., 400, 500 status codes).
        if (!geminiResponse.ok) {
            const errorBody = await geminiResponse.text(); // Get raw text to avoid parsing issues
            console.error("Error from Gemini API:", geminiResponse.status, errorBody);
            return {
                statusCode: geminiResponse.status,
                body: JSON.stringify({ message: `Error from Gemini API: ${geminiResponse.status}. Detail: ${errorBody.substring(0, 200)}...` }), // Truncate detail
                headers: { 'Content-Type': 'application/json' }
            };
        }

        // 8. Parse the successful response from the Gemini API.
        const geminiResult = await geminiResponse.json();

        // 9. Extract and SAFELY parse the generated content.
        let generatedContent = null;
        if (geminiResult.candidates && geminiResult.candidates.length > 0 &&
            geminiResult.candidates[0].content && geminiResult.candidates[0].content.parts &&
            geminiResult.candidates[0].content.parts.length > 0) {
            
            const rawAiText = geminiResult.candidates[0].content.parts[0].text;
            try {
                // IMPORTANT: The Gemini API might sometimes wrap JSON in markdown code blocks (```json ... ```).
                // We need to strip these if present before parsing.
                const jsonStringClean = rawAiText.replace(/```json\n?/, '').replace(/\n?```/, '').trim();
                generatedContent = JSON.parse(jsonStringClean);
            } catch (parseError) {
                console.error("Failed to parse AI response as JSON:", rawAiText, parseError);
                return {
                    statusCode: 500,
                    body: JSON.stringify({ message: "AI generated invalid JSON. Please try again.", detail: parseError.message }),
                    headers: { 'Content-Type': 'application/json' }
                };
            }
        }

        if (!generatedContent || !generatedContent.title || !generatedContent.snippet) {
            console.error("AI response missing expected 'title' or 'snippet':", generatedContent);
            return {
                statusCode: 500,
                body: JSON.stringify({ message: "AI response did not contain expected data. Please try again." }),
                headers: { 'Content-Type': 'application/json' }
            };
        }

        // 10. Send the generated content back to your client-side frontend.
        return {
            statusCode: 200, // OK
            body: JSON.stringify({ title: generatedContent.title, snippet: generatedContent.snippet }),
            headers: { 'Content-Type': 'application/json' }
        };

    } catch (error) {
        // 11. Catch any unexpected errors that occur within this Netlify Function.
        console.error('Netlify Function error:', error);
        return {
            statusCode: 500, // Internal Server Error
            body: JSON.stringify({ message: 'Internal Server Error', detail: error.message }),
            headers: { 'Content-Type': 'application/json' }
        };
    }
};

