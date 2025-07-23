// netlify/functions/get-now-playing.js

// This Netlify Function acts as a secure proxy to the Last.fm API
// to fetch the user's currently playing track.
// Your Last.fm API key and username are stored securely as environment variables on Netlify.

exports.handler = async (event, context) => {
    // 1. Security Check: Only allow GET requests for this public data.
    if (event.httpMethod !== 'GET') {
        return {
            statusCode: 405, // Method Not Allowed
            body: JSON.stringify({ message: 'Method Not Allowed. Only GET requests are accepted.' }),
            headers: { 'Allow': 'GET', 'Content-Type': 'application/json' }
        };
    }

    // 2. Securely retrieve Last.fm API key and username from Netlify Environment Variables.
    // These MUST match the key names you set in Netlify settings.
    const LASTFM_API_KEY = process.env.LASTFM_API_KEY;
    const LASTFM_USERNAME = process.env.LASTFM_USERNAME;

    if (!LASTFM_API_KEY || !LASTFM_USERNAME) {
        console.error("Last.fm environment variables are not set.");
        return {
            statusCode: 500, // Internal Server Error
            body: JSON.stringify({ message: 'Server configuration error: Last.fm API key or username not found.' }),
            headers: { 'Content-Type': 'application/json' }
        };
    }

    try {
        // 3. Construct the Last.fm API URL.
        // We're requesting the user's recent tracks with a limit of 1 (for the current track).
        // 'nowplaying=true' ensures it only returns the currently playing track.
        const lastFmApiUrl = `https://ws.audioscrobbler.com/2.0/?method=user.getrecenttracks&user=${LASTFM_USERNAME}&api_key=${LASTFM_API_KEY}&format=json&limit=1&nowplaying=true`;

        // 4. Make the actual API call to Last.fm.
        const response = await fetch(lastFmApiUrl);

        // 5. Handle potential errors from the Last.fm API.
        if (!response.ok) {
            const errorBody = await response.text();
            console.error("Error from Last.fm API:", response.status, errorBody);
            return {
                statusCode: response.status,
                body: JSON.stringify({ message: `Error from Last.fm API: ${response.status}. Detail: ${errorBody.substring(0, 200)}...` }),
                headers: { 'Content-Type': 'application/json' }
            };
        }

        // 6. Parse the response from Last.fm.
        const data = await response.json();

        // 7. Extract the currently playing track information.
        // Last.fm API structure can be a bit nested.
        const tracks = data?.recenttracks?.track;

        if (tracks && tracks.length > 0) {
            const track = tracks[0];
            // Check if the track has the '@attr' property indicating it's currently playing
            if (track['@attr'] && track['@attr'].nowplaying === 'true') {
                const nowPlaying = {
                    artist: track.artist['#text'],
                    name: track.name,
                    album: track.album['#text'],
                    // Get the largest available image or a placeholder
                    imageUrl: track.image?.find(img => img.size === 'large' || img.size === 'medium')?.['#text'] || 'https://placehold.co/64x64/333333/ffffff?text=No+Art'
                };
                return {
                    statusCode: 200,
                    body: JSON.stringify(nowPlaying),
                    headers: { 'Content-Type': 'application/json' }
                };
            }
        }

        // If no track is currently playing or data is malformed
        return {
            statusCode: 200,
            body: JSON.stringify({ message: 'No track currently playing.' }),
            headers: { 'Content-Type': 'application/json' }
        };

    } catch (error) {
        console.error('Netlify Function error (get-now-playing):', error);
        return {
            statusCode: 500,
            body: JSON.stringify({ message: 'Internal Server Error', detail: error.message }),
            headers: { 'Content-Type': 'application/json' }
        };
    }
};

          
