import crypto from 'node:crypto';
import { webhooksApi } from './meeting.js';
import sse from './sse.js';

/**
 * Webhook
 * register/remove webhook
 * validate incoming webhook
 * @see https://eyeson-team.github.io/api/api-reference/#register-webhooks
 */

const getExisting = async () => {
    return await webhooksApi.get();
};

const clearExisting = async () => {
    const data = await getExisting();
    if (data) {
        await webhooksApi.delete(data.id);
    }
    sse.send('webhook', null);
};

const register = async url => {
    const existing = await getExisting();
    if (existing) {
        if (existing.url === url) {
            return;
        }
        await webhooksApi.delete(existing.id);
    }
    await webhooksApi.post(url, 'room_update');
    const current = await getExisting();
    sse.send('webhook', current);
};

const validate = (req, res, buf, encoding) => {
    const signature = req.header('x-eyeson-signature');
    if (!signature) {
        res.sendStatus(400);
        throw new Error('Invalid header');
    }
    const content = buf.toString(encoding);
    const hmac = crypto.createHmac('sha256', process.env.API_KEY);
    const result = hmac.update(content).digest('hex');
    if (signature !== result) {
        res.sendStatus(400);
        throw new Error('Invalid signature');
    }
};

export default {
    getExisting, clearExisting, register, validate
};