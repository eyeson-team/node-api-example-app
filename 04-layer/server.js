import './env.js';
import webhook from './webhook.js';
import express from 'express';
import meeting from './meeting.js';
import layer from './layer.js';
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
         // console.log('webhook', data);
         try {
             if (data.type === 'room_update') {
                 meeting.onEvent(data.room);
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
/**
 * Layer
 * set text as layer
 */
app.route('/layer/text')
    .post(async (req, res) => {
        try {
            const { title, content, icon } = req.body;
            await layer.applyTextLayer(title, content, icon);
            res.sendStatus(201);
        } catch (error) {
            console.error(error);
            res.status(500).json({ error: error.toString() });
        }
    });

/**
 * Layer
 * set public URL as layer image
 */
app.route('/layer/static')
    .post(async (req, res) => {
        try {
            const { url, zIndex } = req.body;
            await layer.applyImageLayer(url, zIndex);
            res.sendStatus(201);
        } catch (error) {
            console.error(error);
            res.status(500).json({ error: error.toString() });
        }
    });

/**
 * Layer
 * delete back-/foreground layer
 */
app.route('/layer/:zIndex')
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

app.listen(port, () => {
    console.log(`Starting server http://localhost:${port}`);
});
