import { SSE } from 'express-sse';

/**
 * Server Sent Events
 * synchronize clients
 */

const sse = new SSE();

const send = (type, data) => {
    sse.send(data, type);
};

export default {
    init: sse.init, send
};