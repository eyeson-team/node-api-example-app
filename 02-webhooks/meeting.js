import eyesonAPI from 'eyeson-node';
import sse from './sse.js';

const apiKey = process.env.API_KEY;

const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));

const eyeson = new eyesonAPI({ apiKey });

const getApiStatus = () => {
    return Boolean(apiKey);
};

// https://eyeson-team.github.io/api/api-reference/#eyeson-room
const meetingOptions = {
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
        const current = await eyeson.join(username, client.data.room.id, meetingOptions);
        return getClientInfo(current);
    } else {
        client = await eyeson.join(username, null, meetingOptions);
        const data = getClientInfo();
        sse.send('meeting', { type: 'start', data });
    }
};

const stop = async () => {
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

const getClientInfo = (current = client) => {
    if (current) {
        const { data } = current;
        return {
            accessKey: data.access_key,
            userId: data.user.id,
            userName: data.user.name,
            roomId: data.room.id,
            roomName: data.room.name,
            links: data.links
        };
    }
    return null;
};

/**
 * Webhook 'room_update' event
 */
 const onEvent = room => {
    if (client && client.data.room.id === room.id) {
        if (room.shutdown) {
            client = null;
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
    getApiStatus, join, stop, getClientInfo, onEvent
};