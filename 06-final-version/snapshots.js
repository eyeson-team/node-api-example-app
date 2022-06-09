import fs from 'node:fs';
import https from 'node:https';
import sse from './sse.js';
import twitter from './twitter.js';
import meeting, { snapshotsApi } from './meeting.js';

/**
 * Snapshots
 * save meeting snapshots, serve from local
 * auto tweet snapshot
 */

const path = './snapshots/';
let autoTweetStatus = { active: false };

/**
 * Webhook 'snapshot_update' event
 * example:
{
  timestamp: 1651834468,
  type: 'snapshot_update',
  snapshot: {
    id: '627299704620d5000f7be09d',
    name: '1651677552',
    links: {
      download: 'https://s3.eyeson.com/meetings/627298dc4620d5000f7be09a/snapshots/1651677552.jpg?X-Amz-Algorithm=AWS4-HMAC-SHA256&X-Amz-Credential=AH07FBAZO9IYS38J6742%2F20220504%2Fus-east-1%2Fs3%2Faws4_request&X-Amz-Date=20220504T151913Z&X-Amz-Expires=3600&X-Amz-SignedHeaders=host&X-Amz-Signature=bfac60d986046946e68d7277b33182420ffb520a2f21c61dbb8fc861358f14fc'
    },
    creator: {
      id: '627298dd4620d5000f7be09b',
      name: 'Stefan',
      avatar: null,
      guest: false,
      joined_at: '2022-05-04T15:16:48.015Z'
    },
    created_at: '2022-05-04T15:19:12.649Z',
    room: {
      id: '627298dc4620d5000f7be099',
      name: 'Stefan Benicke',
      ready: true,
      started_at: '2022-05-04T15:16:45.316Z',
      shutdown: false,
      sip: [Object],
      guest_token: 'NksS0fiQ9xCPp58ZalS0QFKE'
    }
  }
}
*/
const onEvent = async snapshot => {
    await saveSnapshot(snapshot);
    await tweetSnapshot(snapshot);
};

const saveSnapshot = snapshot => {
    return new Promise(async (resolve, reject) => {
        if (!snapshot.links.download) {
            throw new Error('Missing download URL');
        }
        const dir = path + snapshot.room.id;
        if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir, { recursive: true });
        }
        const dest = `${dir}/${snapshot.name}.jpg`;
        const file = fs.createWriteStream(dest);
        https.get(snapshot.links.download, response => {
            response.pipe(file);
            file.on('finish', () => {
                file.close();
                sse.send('snapshot', { url: `/snapshot/${snapshot.name}.jpg` });
                // try {
                //     snapshotsApi.delete(snapshot.id);
                // } catch (error) {
                //     console.log('delete snapshot error', error);
                // }
                resolve();
            });
        }).on('error', error => {
            if (fs.existsSync(dest)) {
                fs.unlink(dest, () => {});
            }
            reject(error);
        });
    });
};

// http://iamnotmyself.com/2013/06/20/the-worlds-simplest-dynamic-image-service/
const serveImage = (imageId, response) => {
    const client = meeting.getClientInfo();
    if (!client) {
        response.sendStatus(404);
        return;
    }
    const dest = `${path}${client.roomId}/${imageId}.jpg`;
    if (!fs.existsSync(dest)) {
        response.sendStatus(404);
        return;
    }
    const file = fs.createReadStream(dest);
    file.pipe(response);
};

const getCurrentSnapshotList = () => {
    return new Promise(resolve => {
        const result = [];
        const client = meeting.getClientInfo();
        if (!client) {
            resolve(result);
            return;
        }
        fs.readdir(`${path}${client.roomId}/`, (error, files) => {
            if (error) {
                resolve(result);
                return;
            }
            resolve(files
                .filter(name => name.endsWith('.jpg'))
                .map(name => ({ url: `/snapshot/${name}`}))
            );
        });
    });
};

const createSnapshot = async () => {
    await snapshotsApi.post();
};

const tweetSnapshot = async snapshot => {
    if (autoTweetStatus.active === false) {
        return;
    }
    try {
        const src = `${path}${snapshot.room.id}/${snapshot.name}.jpg`;
        if (!fs.existsSync(src)) {
            return;
        }
        const buffer = fs.readFileSync(src);
        await twitter.tweetSnapshot(buffer);
    } catch (error) {
        console.error('snapshots::tweet', error);
    }
};

const getAutoTweetStatus = () => autoTweetStatus;

const setAutoTweetStatus = active => {
    if (autoTweetStatus.active !== active) {
        autoTweetStatus.active = active;
        sse.send('snapshot-twitter', autoTweetStatus);
    }
};

const createCurl = () => {
    const client = meeting.getClientInfo();
    return `curl -X POST https://api.eyeson.team/rooms/${client.accessKey}/snapshot`;
};

export default {
    onEvent, serveImage, getCurrentSnapshotList, createSnapshot, getAutoTweetStatus, setAutoTweetStatus, createCurl
};