import eyesonAPI from '@eyeson/node';
import sse from './sse.js';
import participants from './participants.js';
import twitter from './twitter.js';
import publicTransport from './public-transport.js';

/**
 * Meeting
 * start/stop meeting
 * join participant to running meeting
 * some centralized helper methods
 * @see https://eyeson-team.github.io/api/api-reference/#eyeson-room
 * @see https://github.com/eyeson-team/eyeson-node
 */

const apiKey = process.env.API_KEY;

const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));

const eyeson = new eyesonAPI({ apiKey });

const getApiStatus = () => {
    return Boolean(apiKey);
};

// https://eyeson-team.github.io/api/api-reference/#eyeson-room
const _options = {
    name: 'WAD workshop demo',
    options: {
        exit_url: 'https://explore.eyeson.com/wad',
        sfu_mode: 'disabled',
        custom_fields: {
            logo: 'https://storage.googleapis.com/eyeson-demo/pictures/icon-wad.png',
            virtual_background: true,
            virtual_background_allow_guest: true
        }
    }
};
let client = null;

const join = async username => {
    if (client) {
        const current = await eyeson.join(username, client.data.room.id, _options);
        const data = getClientInfo(current);
        return data;
    } else {
        client = await eyeson.join(username, null, _options);
        const data = getClientInfo();
        sse.send('meeting', { type: 'start', data });
    }
};

const stop = async () => {
    twitter.stopEventStream();
    participants.clearList();
    if (client) {
        try {
            try {
                // used to display a bye bye screen instead of error page
                await client.chat('/will_terminate');
                await sleep(100);
            } catch (e) {}
            await client.stopMeeting();
        } catch (error) {
            console.error('meeting::stop', error);
        }
        client = null;
    }
    publicTransport.stop();
    sse.send('meeting', { type: 'exit' });
};

const getClient = () => client;

/**
 * Extract basic data from client's object
 */
const getClientInfo = current => {
    if (!current) {
        current = client;
    }
    if (!current) {
        return null;
    }
    const { data } = current;
    return {
        accessKey: data.access_key,
        userId: data.user.id,
        userName: data.user.name,
        roomId: data.room.id,
        roomName: data.room.name,
        links: data.links
    };
};

/**
 * Webhook 'room_update' event
 */
const onEvent = room => {
    if (client && client.data.room.id === room.id) {
        if (room.shutdown) {
            client = null;
            twitter.stopEventStream();
            participants.clearList();
            publicTransport.stop();
            sse.send('meeting', { type: 'exit' });
        }
    }
};

/**
 * Snapshot handling
 * custom implementation
 */
export const snapshotsApi = {
    post: async () => {
        if (client) {
            await client.api.post(`/rooms/${client.accessKey}/snapshot`);
        }
    },
    delete: id => eyeson.api.delete(`/snapshots/${id}`)
};

/**
 * Webhook registration handling
 * custom implementation
 */
export const webhooksApi = {
    get: () => eyeson.api.get('/webhooks'),
    delete: id => eyeson.api.delete(`/webhooks/${id}`),
    post: (url, types) => eyeson.api.post('/webhooks', { url, types })
};

const createCurl = user => {
    return `curl -X POST \\
-H "Authorization: YOUR_API_KEY" \\
-d "name=WAD workshop demo" \\
-d "user[name]=${user}" \\
-d "options[exit_url]=https://explore.eyeson.com/wad" \\
-d "options[sfu_mode]=disabled" \\
-d "options[custom_fields][logo]=https://storage.googleapis.com/eyeson-demo/pictures/icon-wad.png" \\
-d "options[custom_fields][virtual_background]=true" \\
-d "options[custom_fields][virtual_background_allow_guest]=true" \\
https://api.eyeson.team/rooms`;
};

export default {
    getApiStatus, join, stop, getClientInfo, getClient, onEvent, createCurl
};