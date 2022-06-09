import './env.js';
import express from 'express';
import meeting from './meeting.js';

const port = process.env.PORT || 8080;

const app = express();

app.use(express.static('client/public'));
app.use(express.json());

app.route('/api/status')
    .get(async (_req, res) => {
        res.json({ ready: meeting.getApiStatus() });
    });

app.route('/meeting')
    .get((_req, res) => {
        res.json(meeting.getClientInfo());
    })
    .post(async (req, res) => {
        try {
            const { user } = req.body;
            const info = await meeting.join(user);
            res.status(201).json(info);
        } catch (error) {
            console.error(error);
            res.status(500).json({ error: error.toString() });
        }
    })
    .delete(async (_req, res) => {
        await meeting.stop();
        res.sendStatus(200);
    });

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

app.listen(port, () => {
    console.log(`Starting server http://localhost:${port}`);
});
