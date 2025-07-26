// netlify/functions/chatbot-tools.js

// This is a new Netlify Function dedicated to executing the "tools"
// that the AI model can request. It acts as a secure backend executor
// for real-world actions.

// Helper function to fetch "Now Playing" data from Last.fm
async function getNowPlaying() {
    const { LASTFM_API_KEY, LASTFM_USERNAME } = process.env;
    if (!LASTFM_API_KEY || !LASTFM_USERNAME) {
        return { error: "Server not configured for Last.fm API." };
    }
    const url = `https://ws.audioscrobbler.com/2.0/?method=user.getrecenttracks&user=${LASTFM_USERNAME}&api_key=${LASTFM_API_KEY}&format=json&limit=1`;
    try {
        const response = await fetch(url);
        if (!response.ok) return { error: "Failed to fetch data from Last.fm." };
        const data = await response.json();
        const track = data?.recenttracks?.track?.[0];
        if (track && track['@attr']?.nowplaying === 'true') {
            return {
                artist: track.artist['#text'],
                song: track.name,
                album: track.album['#text']
            };
        }
        return { status: "Not currently playing anything." };
    } catch (error) {
        return { error: "Error connecting to Last.fm." };
    }
}

// Main handler for the serverless function
exports.handler = async (event) => {
    if (event.httpMethod !== 'POST') {
        return { statusCode: 405, body: 'Method Not Allowed' };
    }

    try {
        const { toolName, args } = JSON.parse(event.body);
        let result;

        switch (toolName) {
            case 'get_now_playing':
                result = await getNowPlaying();
                break;

            case 'get_current_time':
                const date = new Date();
                const time = date.toLocaleTimeString('en-US', { timeZone: 'Asia/Kolkata', hour: '2-digit', minute: '2-digit' });
                result = { time: time, timezone: "IST (India Standard Time)" };
                break;
            
            case 'get_visitor_ip':
                 const ip = event.headers['x-nf-client-connection-ip'] || 'Unavailable';
                 result = { ip_address: ip };
                 break;

            case 'interpret_dream':
                // This is a simple, fun "tool" that just adds flavor.
                const dream = args.dream_description || "an unknown dream";
                result = { interpretation: `Dreaming of ${dream} often symbolizes a desire for creative freedom and breaking through old boundaries. Or maybe you just ate a spicy curry before bed!` };
                break;

            default:
                result = { error: `Unknown tool: ${toolName}` };
        }

        return {
            statusCode: 200,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(result)
        };

    } catch (error) {
        return {
            statusCode: 500,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ error: 'An internal error occurred.', details: error.message })
        };
    }
};
