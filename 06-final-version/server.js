import './env.js';
import express from 'express';
import webhook from './webhook.js';
import meeting from './meeting.js';
import recordings from './recordings.js';
import snapshots from './snapshots.js';
import twitter from './twitter.js';
import ghost from './ghost.js';
import participants from './participants.js';
import layer from './layer.js';
import layout from './layout.js';
import virtualRoom from './virtual-room.js';
import broadcast from './broadcast.js';
import playback from './playback.js';
import userAction from './user-action.js';
import publicTransport from './public-transport.js';
import sse from './sse.js';

const port = process.env.PORT || 8080;

const app = express();

const addWebhookCors = res => {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Methods', 'POST,OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Content-Type, Content-Length, x-powered-by, x-eyeson-signature');
};

app.use(express.static('client/public'));
app.use('/videos', express.static('videos'));
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
app.get('/sse', (_req, res, next) => {
    if (typeof res.flush !== 'function') {
        res.flush = () => {}; 
    }
    next();
}, sse.init);

/**
 * eyeson webhook endpoint
 * registered types: room_update, recording_update, snapshot_update, participant_update
 */
app.route('/webhook')
    .options((_req, res) => {
        // just for internal test, not needed in production
        addWebhookCors(res);
        res.sendStatus(200);
    })
    .post((req, res) => {
        const data = req.body;
        console.log('webhook', data);
        try {
            if (data.type === 'room_update') {
                meeting.onEvent(data.room);
            }
            else if (data.type === 'recording_update') {
                recordings.onEvent(data.recording);
            }
            else if (data.type === 'snapshot_update') {
                snapshots.onEvent(data.snapshot);
            }
            else if (data.type === 'participant_update') {
                participants.onEvent(data.participant);
                userAction.onEvent(data.participant);
            }
        } catch (error) {
            console.error('webhook error', error);
        }
        addWebhookCors(res);
        res.sendStatus(201); // not required, but we're kind
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
    .get(async (_req, res) => {
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
app.route('/join')
    .post(async (req, res) => {
        try {
            const { user } = req.body;
            const client = await meeting.join(user);
            res.status(201).json(client);
        } catch (error) {
            console.error(error);
            res.status(500).json({ error: error.toString() });
        }
    });

/**
 * Webhook
 * get existing webhook info, register new, remove webhook
 */
app.route('/hook')
    .get(async (_req, res) => {
        try {
            const data = await webhook.getExisting();
            res.json(data);
        } catch (error) {
            console.error(error);
            res.status(500).json({ error: error.toString() });
        }
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

/**
 * RTMP ghost
 * get current state, start/stop ghost
 */
app.route('/rtmp')
    .get((_req, res) => {
        res.json(ghost.rtmp.state);
    })
    .post((_req, res) => {
        try {
            const { links } = meeting.getClientInfo();
            ghost.rtmp.start(links.guest_join);
            res.sendStatus(201);
        } catch (error) {
            res.status(500).json({ error: error.toString() });
        }
    })
    .delete((_req, res) => {
        ghost.rtmp.stop();
        res.sendStatus(200);
    });

/**
 * RTSP ghost
 * get current state, start/stop ghost
 */
app.route('/rtsp')
    .get((_req, res) => {
        res.json(ghost.rtsp.state);
    })
    .post((req, res) => {
        try {
            const { src } = req.body;
            const { links } = meeting.getClientInfo();
            ghost.rtsp.start(src, links.guest_join);
            res.sendStatus(201);
        } catch (error) {
            res.status(500).json({ error: error.toString() });
        }
    })
    .delete((_req, res) => {
        ghost.rtsp.stop();
        res.sendStatus(200);
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
 * Snapshot
 * get list of stored snapshots, trigger snapshot
 */
app.route('/snapshot')
    .get(async (_req, res) => {
        const list = await snapshots.getCurrentSnapshotList();
        res.json(list);
    })
    .post(async (_req, res) => {
        await snapshots.createSnapshot();
        res.sendStatus(201);
    });

/**
 * View snapshot
 * serve snapshot image
 */
app.route('/snapshot/:imageId.jpg')
    .get((req, res) => {
        const { imageId } = req.params;
        snapshots.serveImage(imageId, res);
    });
    
/**
 * Snapshot Twitter post
 * enable/disable automatic snapshot twitter action
 */
app.route('/snapshot/twitter')
    .get((_req, res) => {
        const status = snapshots.getAutoTweetStatus();
        res.json(status);
    })
    .post((req, res) => {
        const { active } = req.body;
        snapshots.setAutoTweetStatus(active);
        res.sendStatus(201);
    });

/**
 * Recording
 * get list of stored recordings
 */
app.route('/recordings')
    .get(async (_req, res) => {
        const list = await recordings.getCurrentRecordingList();
        res.json(list);
    });

/**
 * View recording
 * serve recording video
 */
app.route('/recordings/:recordId.webm')
    .get((req, res) => {
        const { recordId } = req.params;
        recordings.serveVideo(recordId, req, res);
    });


/**
 * Recording
 * start/stop recording
 */
app.route('/recording')
    .get((_req, res) => {
        const current = recordings.getCurrentState();
        res.json(current);
    })
    .post(async (_req, res) => {
        try {
            await recordings.startRecording();
            res.sendStatus(201);
        } catch (error) {
            console.error(error);
            res.status(500).json({ error: error.toString() });
        }
    })
    .delete(async (_req, res) => {
        try {
            await recordings.stopRecording();
            res.sendStatus(200);
        } catch (error) {
            console.error(error);
            res.status(500).json({ error: error.toString() });
        }
    });

app.route('/twitter/status')
    .get((_req, res) => {
        res.json({ ready: twitter.getStatus() });
    });

/**
 * Twitter stream subscription
 * get current state, subscribe, end subscription
 */
app.route('/twitter/stream')
    .get((_req, res) => {
        const status = twitter.getStreamStatus();
        res.json(status);
    })
    .post(async (req, res) => {
        const { filter } = req.body;
        try {
            await twitter.startEventStream(filter);
            res.sendStatus(201);
        } catch (error) {
            console.error(error);
            res.status(500).json({ error: error.toString() });
        }
    })
    .delete((_req, res) => {
        twitter.stopEventStream();
        res.sendStatus(200);
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
 * Playback
 * Start playback, list local video files
 */
app.route('/playback')
    .get(async (_req, res) => {
        const list = await playback.getLocalVideos();
        res.json(list);
    })
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

/**
 * Layer
 * set back-/foreground layer
 * delete back-/foreground layer
 */
app.route('/layer/:zIndex')
    .post(async (req, res) => {
        const { url } = req.body;
        const { zIndex } = req.params;
        try {
            await layer.applyLayer(url, zIndex);
            res.sendStatus(201);
        } catch (error) {
            console.error(error);
            res.status(500).json({ error: error.toString() });
        }
    })
    .delete(async (req, res) => {
        const { zIndex } = req.params;
        try {
            await layer.clearLayer(zIndex);
            res.sendStatus(200);
        } catch (error) {
            console.error(error);
            res.status(500).json({ error: error.toString() });
        }
    });

/**
 * Virtual room
 * apply predefined layout, clear meeting layout
 */
app.route('/virtual-room')
    .post(async (req, res) => {
        const { demo, users } = req.body;
        try {
            await virtualRoom.applyLayout(demo, users);
            res.sendStatus(201);
        } catch (error) {
            console.error(error);
            res.status(500).json({ error: error.toString() });
        }
    })
    .delete(async (_req, res) => {
        try {
            await virtualRoom.clearLayout();
            res.sendStatus(200);
        } catch (error) {
            console.error(error);
            res.status(500).json({ error: error.toString() });
        }
    });

/**
 * Broadcast
 * get current state, start/stop broadcast
 */
app.route('/broadcast')
    .get((_req, res) => {
        const current = broadcast.getCurrent();
        res.json(current);
    })
    .post(async (req, res) => {
        const { streamUrl } = req.body;
        try {
            await broadcast.startBroadcast(streamUrl);
            res.sendStatus(201);
        } catch (error) {
            console.error(error);
            res.status(500).json({ error: error.toString() });
        }
    })
    .delete(async (_req, res) => {
        try {
            await broadcast.stopBroadcast();
            res.sendStatus(200);
        } catch (error) {
            console.error(error);
            res.status(500).json({ error: error.toString() });
        }
    });

/**
 * User action
 * automated action when users join the meeting
 */
app.route('/user-action')
    .get((_req, res) => {
        const status = userAction.getStatus();
        res.json(status);
    })
    .post((req, res) => {
        const { active } = req.body;
        userAction.setStatus(active);
        res.sendStatus(201);
    });

/**
 * Public transport
 * get current state, enable/disable public transport info overlay
 */
app.route('/public-transport')
    .get((_req, res) => {
        const status = publicTransport.getStatus();
        res.json(status);
    })
    .post(async (req, res) => {
        try {
            const { station } = req.body;
            await publicTransport.setStatus(true, station);
            res.sendStatus(201);
        } catch (error) {
            console.error(error);
            res.status(500).json({ error: error.toString() });
        }
    })
    .delete(async (_req, res) => {
        await publicTransport.setStatus(false);
        res.sendStatus(200);
    });

/**
 * Public transport search station
 * search station by name
 */
app.route('/public-transport/search')
    .get(async (req, res) => {
        try {
            const { station } = req.query;
            const result = await publicTransport.searchStation(station);
            res.json(result);
        } catch (error) {
            console.error(error);
            res.status(500).json({ error: error.toString() });
        }
    });

const curlRouter = express.Router();
app.use('/curl', curlRouter);
curlRouter.get('/meeting', (req, res) => {
    res.json({ cmd: meeting.createCurl(req.query.user) });
});
curlRouter.get('/broadcast/start', (req, res) => {
    res.json({ cmd: broadcast.createCurlStart(req.query.url) });
});
curlRouter.get('/broadcast/stop', (_req, res) => {
    res.json({ cmd: broadcast.createCurlStop() });
});
curlRouter.get('/recording/start', (_req, res) => {
    res.json({ cmd: recordings.createCurlStart() });
});
curlRouter.get('/recording/stop', (_req, res) => {
    res.json({ cmd: recordings.createCurlStop() });
});
curlRouter.get('/playback', (req, res) => {
    const { url, audio } = req.query;
    res.json({ cmd: playback.createCurl(url, audio) });
});
curlRouter.get('/snapshot', (_req, res) => {
    res.json({ cmd: snapshots.createCurl() });
});
curlRouter.get('/layout', (req, res) => {
    res.json({ cmd: layout.createCurl(req.query.layout) });
});
curlRouter.get('/layer', (req, res) => {
    const { url, zIndex } = req.query;
    res.json({ cmd: layer.createCurl(url, zIndex) });
});

app.listen(port, () => {
    console.log(`Starting server http://localhost:${port}`);
});
