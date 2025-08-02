// netlify/functions/get-current-time.js

/**
 * This function returns the current time in India.
 * It's a simple tool that requires no arguments.
 */
exports.handler = async (event) => {
    // 1. Security Check: Expect a GET request.
    if (event.httpMethod !== 'GET') {
        return {
            statusCode: 405,
            body: JSON.stringify({ message: 'Method Not Allowed' }),
            headers: { 'Allow': 'GET' }
        };
    }

    try {
        // 2. Define options for Indian Standard Time (IST).
        const options = {
            timeZone: 'Asia/Kolkata',
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit',
            hour12: true
        };

        // 3. Get the current time and format it.
        const currentTime = new Date().toLocaleTimeString('en-US', options);

        // 4. Return the result in a JSON object.
        return {
            statusCode: 200,
            body: JSON.stringify({ currentTime: currentTime })
        };

    } catch (error) {
        console.error('Netlify Function error (get-current-time):', error);
        return {
            statusCode: 500,
            body: JSON.stringify({ message: 'An internal server error occurred while fetching the time.' })
        };
    }
};