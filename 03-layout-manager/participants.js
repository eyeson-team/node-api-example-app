import sse from './sse.js';

/**
 * Participants
 * keep track of meeting participants
 * information provided by webhook
 */

const _list = new Map();

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
    if (participant.online) {
        addParticipant(participant);
    } else {
        removeParticipant(participant);
    }
};

const addParticipant = participant => {
    _list.set(participant.id, participant);
    sse.send('members', { type: 'add', participant });
};

const removeParticipant = participant => {
    _list.delete(participant.id);
    sse.send('members', { type: 'remove', participant });
};

const getParticipantList = () => {
    return Array.from(_list, entry => entry[1]);
};

const clearList = () => {
    _list.clear();
};

export default {
    getParticipantList, clearList, onEvent
};
