import fs from 'node:fs';
import meeting from './meeting.js';

/**
 * Playback
 * start playback, list video files stores locally in /videos
 */

const path = './videos/';

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

const getLocalVideos = () => {
    return new Promise(resolve => {
        fs.readdir(path, (error, files) => {
            if (error) {
                console.error('playback::getLocalVideos', error);
                resolve([]);
                return;
            }
            resolve(files
                .filter(name => name.endsWith('.webm'))
                .map(name => ({ url: `/videos/${name}`}))
            );
        });
    });
};

const createCurl = (url, audio) => {
    const client = meeting.getClientInfo();
    return `curl -X POST \\
-d "playback[audio]=${audio ? 'true' : 'false'}" \\
-d "playback[play_id]=playback-demo" \\
-d "playback[url]=${url}" \\
https://api.eyeson.team/rooms/${client.accessKey}/playbacks`;
};

export default {
    start, getLocalVideos, createCurl
};