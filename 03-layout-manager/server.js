import './env.js';
import express from 'express';
import webhook from './webhook.js';
import meeting from './meeting.js';
import participants from './participants.js';
import layout from './layout.js';
import playback from './playback.js';
import sse from './sse.js';

const port = process.env.PORT || 8080;

const app = express();

app.use(express.static('client/public'));
app.use(express.json({
    verify: (req, res, buf, encoding) => {
        if (req.url === '/webhook' && req.method === 'POST') {
            webhook.validate(req, res, buf, encoding);
        }
    }
}));

/**
 * Server Sent Events
 * synchronize clients
 */
app.get('/sse', sse.init);

/**
 * eyeson webhook endpoint
 * registered types: room_update, recording_update
 */
app.route('/webhook')
    .options((_req, res) => {
        res.sendStatus(200);
    })
    .post((req, res) => {
        const data = req.body;
        // console.log('webhook', data);
        try {
            if (data.type === 'room_update') {
                meeting.onEvent(data.room);
            }
            else if (data.type === 'participant_update') {
                participants.onEvent(data.participant);
            }
        } catch (error) {
            console.error('webhook error', error);
        }
        res.sendStatus(201); // not required, but we're kind
    });

/**
 * Webhook
 * get existing webhook info, register new, remove webhook
 */
 app.route('/hook')
    .get(async (_req, res) => {
        const data = await webhook.getExisting();
        res.json(data);
    })
    .post(async (req, res) => {
        const { url } = req.body;
        await webhook.register(url);
        res.sendStatus(201);
    })
    .delete(async (_req, res) => {
        await webhook.clearExisting();
        res.sendStatus(200);
    });

app.route('/api/status')
    .get(async (_req, res) => {
        res.json({ ready: meeting.getApiStatus() });
    });
 
/**
 * Meeting
 * start a meeting, stop meeting, get meeting data
 */
app.route('/meeting')
    .get((_req, res) => {
        const data = meeting.getClientInfo();
        res.json({ active: Boolean(data), data });
    })
    .post(async (req, res) => {
        try {
            const { user } = req.body;
            await meeting.join(user);
            res.sendStatus(201);
        } catch (error) {
            console.error(error);
            res.status(500).json({ error: error.toString() });
        }
    })
    .delete(async (_req, res) => {
        await meeting.stop();
        res.sendStatus(200);
    });

/**
 * Join participants
 * join new participants to existing meeting
 */
app.post('/join', async (req, res) => {
    try {
        const { user } = req.body;
        const info = await meeting.join(user);
        res.status(201).json(info);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: error.toString() });
    }
});

/**
 * Participants
 * get current online participants (meeting members)
 */
 app.route('/members')
    .get((_req, res) => {
        const list = participants.getParticipantList();
        res.json(list);
    });

/**
 * Layout
 * set layout with options
 */
app.route('/layout')
    .post(async (req, res) => {
        try {
            const { name, users, showNames, autofill } = req.body;
            await layout.applyLayout(name, users, showNames, autofill);
            res.sendStatus(201);
        } catch (error) {
            console.error(error);
            res.status(500).json({ error: error.toString() });
        }
    });

/**
 * Playback
 * Start playback, list local video files
 */
 app.route('/playback')
    .post(async (req, res) => {
        const { url, audio } = req.body;
        try {
            await playback.start(url, audio);
            res.sendStatus(201);
        } catch (error) {
            console.error(error);
            res.status(500).json({ error: error.toString() });
        }
    });

app.listen(port, () => {
    console.log(`Starting server http://localhost:${port}`);
});
