import eyesonAPI from 'eyeson-node';
import sse from './sse.js';
import participants from './participants.js';

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
            participants.clearList();
            sse.send('meeting', { type: 'exit' });
        }
    }
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

export default {
    getApiStatus, join, stop, getClientInfo, getClient, onEvent
};