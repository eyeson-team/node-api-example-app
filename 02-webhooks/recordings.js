import fs from 'node:fs';
import https from 'node:https';
import meeting from './meeting.js';
import sse from './sse.js';

/**
 * Recordings
 * save meeting recordings, serve from local
 * start/stop recording
 */

const path = './recordings/';
let current = { active: false };

/**
 * Webhook 'recording_update' event
 * example:
{
  timestamp: 1651834468,
  type: 'recording_update',
  recording: {
    id: '6274fe56c6d9a2000fe34ff7',
    created_at: 1651834455,
    duration: 12,
    links: {
      self: 'https://api.eyeson.team/recordings/6274fe56c6d9a2000fe34ff7',
      download: 'https://s3.eyeson.com/meetings/6274fe419d2c31000fbc00bb/6274fe56c6d9a2000fe34ff7?X-Amz-Algorithm=AWS4-HMAC-SHA256&X-Amz-Credential=AH07FBAZO9IYS38J6742%2F20220506%2Fus-east-1%2Fs3%2Faws4_request&X-Amz-Date=20220506T105428Z&X-Amz-Expires=3600&X-Amz-SignedHeaders=host&X-Amz-Signature=e0e3cb3364a411bcb94b790eb7bdc594dc18bcdbba2ddd680d9624fca783b2d7'
    },
    user: {
      id: '6274fe429d2c31000fbc00bc',
      name: 'Stefan',
      avatar: null,
      guest: false,
      joined_at: '2022-05-06T10:53:57.222Z'
    },
    room: {
      id: '6274fe419d2c31000fbc00ba',
      name: 'Stefan Benicke',
      ready: true,
      started_at: '2022-05-06T10:53:54.560Z',
      shutdown: false,
      sip: [Object],
      guest_token: 'JcJfx9cz9e5HB2OGkZOh5yrf'
    }
  }
}
 */
const onEvent = recording => {
    if (current.active) {
        updateCurrentState(false);
    }
    saveRecording(recording);
};

const saveRecording = recording => {
    return new Promise(async (resolve, reject) => {
        if (!recording.links.download) {
            throw new Error('Missing download URL');
        }
        const dir = path + recording.room.id;
        if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir, { recursive: true });
        }
        const dest = `${dir}/${recording.id}.webm`;
        const file = fs.createWriteStream(dest);
        https.get(recording.links.download, response => {
            response.pipe(file);
            file.on('finish', () => {
                file.close();
                sse.send('recordings', { url: `/recordings/${recording.id}.webm` });
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

const getCurrentRecordingList = () => {
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
                .filter(name => name.endsWith('.webm'))
                .map(name => ({ url: `/recordings/${name}`}))
            );
        });
    });
};

// https://dev.to/abdisalan_js/how-to-code-a-video-streaming-server-using-nodejs-2o0
const serveVideo = (recordId, req, res) => {
    const client = meeting.getClientInfo();
    if (!client) {
        res.sendStatus(404);
        return;
    }
    const dest = `${path}${client.roomId}/${recordId}.webm`;
    if (!fs.existsSync(dest)) {
        res.sendStatus(404);
        return;
    }
    const { range } = req.headers;
    const videoSize = fs.statSync(dest).size;
    const CHUNK_SIZE = 10 ** 6; // 1MB
    const start = !range ? 0 : Number(range.replace(/\D/g, ''));
    const end = Math.min(start + CHUNK_SIZE, videoSize - 1);
    const contentLength = end - start + 1;
    const headers = {
        'Content-Range': `bytes ${start}-${end}/${videoSize}`,
        'Accept-Ranges': 'bytes',
        'Content-Length': contentLength,
        'Content-Type': 'video/webm'
    };
    res.writeHead(206, headers);
    const videoStream = fs.createReadStream(dest, { start, end });
    videoStream.pipe(res);
};

const startRecording = async () => {
    const client = meeting.getClient();
    if (client) {
        await client.startRecording();
    }
    updateCurrentState(true);
};

const stopRecording = async () => {
    updateCurrentState(false);
    const client = meeting.getClient();
    if (client) {
        await client.stopRecording();
    }
};

const getCurrentState = () => current;

const updateCurrentState = active => {
    current.active = active;
    sse.send('recording', current);
};

export default {
    onEvent, getCurrentRecordingList, serveVideo,
    startRecording, stopRecording, getCurrentState
};