import meeting from './meeting.js';
import sse from './sse.js';

/**
 * Broadcast
 * start/stop RTMP broadcast
 * @see https://eyeson-team.github.io/api/api-reference/#broadcast
 */

const current = {
    active: false,
    streamUrl: ''
};

const startBroadcast = async stream_url => {
    updateCurrentStreamUrl(stream_url);
    const client = meeting.getClient();
    if (!client) {
        return;
    }
    await client.startBroadcast(stream_url);
    updateCurrentState(true);
};

const stopBroadcast = async () => {
    updateCurrentState(false);
    const client = meeting.getClient();
    if (!client) {
        return;
    }
    await client.stopBroadcast();
};

const updateCurrentStreamUrl = stream_url => {
    current.streamUrl = stream_url;
    sse.send('broadcast', current);
};

const updateCurrentState = active => {
    current.active = active;
    sse.send('broadcast', current);
};

const getCurrent = () => current;

const createCurlStart = url => {
    const client = meeting.getClientInfo();
    return `curl -X POST \\
-d "stream_url=${url}" \\
https://api.eyeson.team/rooms/${client.accessKey}/broadcasts`;
};

const createCurlStop = () => {
    const client = meeting.getClientInfo();
    return `curl -X DELETE https://api.eyeson.team/rooms/${client.accessKey}/broadcasts`;
};

export default {
    getCurrent, startBroadcast, stopBroadcast,
    createCurlStart, createCurlStop
};