import meeting from './meeting.js';

/**
 * Playback
 */

/**
 * Start playback with predefined play_id
 */
 const start = async (url, audio = false) => {
    const client = meeting.getClient();
    if (!client) {
        return;
    }
    const play_id = 'playback-demo';
    await client.startPlayback({ playback: { url, audio, play_id } });
};

export default { start };