// netlify/functions/get-now-playing.js

/**
 * This function acts as a secure proxy to the Last.fm API 
 * to fetch the user's currently playing track.
 */
exports.handler = async (event) => {
    // 1. Security Check: This tool is invoked by the frontend without arguments, so we expect a GET request.
    if (event.httpMethod !== 'GET') {
        return {
            statusCode: 405,
            body: JSON.stringify({ message: 'Method Not Allowed' }),
            headers: { 'Allow': 'GET' }
        };
    }

    // 2. Securely retrieve Last.fm credentials from environment variables.
    const { LASTFM_API_KEY, LASTFM_USERNAME } = process.env;
    if (!LASTFM_API_KEY || !LASTFM_USERNAME) {
        console.error("Last.fm environment variables are not set.");
        return {
            statusCode: 500,
            body: JSON.stringify({ message: 'Server configuration error for music service.' })
        };
    }

    try {
        // 3. Construct and call the Last.fm API.
        const lastFmApiUrl = `https://ws.audioscrobbler.com/2.0/?method=user.getrecenttracks&user=${LASTFM_USERNAME}&api_key=${LASTFM_API_KEY}&format=json&limit=1`;
        const response = await fetch(lastFmApiUrl);

        if (!response.ok) {
            console.error("Error from Last.fm API:", response.status);
            return {
                statusCode: response.status,
                body: JSON.stringify({ message: "Could not connect to the music service." })
            };
        }

        const data = await response.json();
        
        // 4. Parse the track information.
        const track = data?.recenttracks?.track?.[0];

        if (track && track['@attr']?.nowplaying === 'true') {
            const nowPlaying = {
                artist: track.artist['#text'],
                name: track.name,
                album: track.album['#text'],
                imageUrl: track.image?.find(img => img.size === 'large')?.['#text'] || 'https://placehold.co/64x64/333333/ffffff?text=No+Art'
            };
            return {
                statusCode: 200,
                body: JSON.stringify(nowPlaying)
            };
        }

        // 5. Return a message if no track is currently playing.
        return {
            statusCode: 200,
            body: JSON.stringify({ message: "No track is currently playing on Last.fm." })
        };

    } catch (error) {
        console.error('Netlify Function error (get-now-playing):', error);
        return {
            statusCode: 500,
            body: JSON.stringify({ message: 'An internal server error occurred while fetching music data.' })
        };
    }
};