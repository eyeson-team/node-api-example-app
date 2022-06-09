import meeting from './meeting.js';
import sse from './sse.js';

/**
 * UserAction
 * action on user join demo
 * play random giphy when user joins
 */

const status = { active: false };

const helloGiphys = [
    'https://media.giphy.com/media/3oKIPsx2VAYAgEHC12/giphy.mp4',
    'https://media.giphy.com/media/Vbtc9VG51NtzT1Qnv1/giphy.mp4',
    'https://media.giphy.com/media/3pZipqyo1sqHDfJGtz/giphy.mp4',
    'https://media.giphy.com/media/28GHfhGFWpFgsQB4wR/giphy.mp4',
    'https://media.giphy.com/media/xT9IgG50Fb7Mi0prBC/giphy.mp4'
];

const randomGiphy = () => {
    return helloGiphys[Math.floor(Math.random() * helloGiphys.length)];
};

/**
 * Webhook 'participant_update' event
 * example:
{
  timestamp: 1651677434,
  type: 'participant_update',
  participant: {
    id: '627298dd4620d5000f7be09b',
    room_id: '627298dc4620d5000f7be099',
    name: 'Stefan',
    avatar: null,
    guest: false,
    online: true
  }
}
 */
const onEvent = participant => {
    if (status.active === false) {
        return;
    }
    if (participant.online) {
        playGiphy(participant.id).catch(error => console.error('UserAction::playGiphy', error));
    }
};

const playGiphy = async participantId => {
    const client = meeting.getClient();
    if (!client) {
        return;
    }
    await client.startPlayback({
        audio: false,
        play_id: (''+Date.now()),
        replacement_id: (''+participantId),
        url: randomGiphy()
    });
};

const getStatus = () => status;

const setStatus = active => {
    if (status.active !== active) {
        status.active = active;
        sse.send('user-action', status);
    }
};

export default {
    onEvent, getStatus, setStatus
};
