import fetch, { FormData, Blob } from 'node-fetch';
import nodeCanvas from 'canvas';
import meeting from './meeting.js';

/**
 * Layer
 * uses canvas to create layer
 * twitter overlay and public transport overlay
 * @see https://eyeson-team.github.io/api/api-reference/#content-integration-aka-layers
 */

const { createCanvas, loadImage, registerFont } = nodeCanvas;

registerFont('./assets/fonts/Open_Sans/OpenSans-Regular.ttf', { family: 'OpenSans' });
registerFont('./assets/fonts/Open_Sans/OpenSans-Bold.ttf', { family: 'OpenSans', weight: 'bold' });

// just to look a bit nicer
// otherwise ctx.rect() could have been used
const roundRect = (context, x, y, w, h, radius) => {
    const r = x + w;
    const b = y + h;
    context.beginPath();
    context.moveTo(x + radius, y);
    context.lineTo(r - radius, y);
    context.quadraticCurveTo(r, y, r, y + radius);
    context.lineTo(r, y + h - radius);
    context.quadraticCurveTo(r, b, r - radius, b);
    context.lineTo(x + radius, b);
    context.quadraticCurveTo(x, b, x, b - radius);
    context.lineTo(x, y + radius);
    context.quadraticCurveTo(x, y, x + radius, y);
    context.fill();
};

const images = {
    suburban: null,
    subway: null,
    bus: null,
    direction: null
};

const initImage = async type => {
    if (images[type]) {
        return images[type];
    }
    images[type] = await loadImage(`./assets/images/${type}.png`);
    return images[type];
};

const colors = {
    good: 'green',
    bad: 'red',
    suburban: 'rgb(55,135,74)',
    subway: 'rgb(0,51,153)',
    bus: 'rgb(153,51,153)'
};

const addDeparture = async (ctx, entry, x, y) => {
    ctx.fillText(entry.departure, x, y);
    x += ctx.measureText(entry.departure).width + 5;
    if (entry.delay !== 0) {
        ctx.fillStyle = colors[entry.delay > 0 ? 'bad' : 'good'];
        const text = (entry.delay > 0 ? '+' : '-') + Math.abs(entry.delay);
        ctx.fillText(text, x, y);
        x += ctx.measureText(text).width + 5;
    }
    const typeImg = await initImage(entry.type);
    ctx.drawImage(typeImg, x, y + 2);
    x += 25;
    ctx.fillStyle = colors[entry.type];
    const lineNameWidth = ctx.measureText(entry.line).width + 6;
    roundRect(ctx, x, y + 2, lineNameWidth, 20, 3);
    ctx.fillStyle = 'white';
    ctx.fillText(entry.line, x + 3, y);
    ctx.fillStyle = 'black';
    x += lineNameWidth + 5;
    const directionImg = await initImage('direction');
    ctx.drawImage(directionImg, x, y + 2);
    x += 25;
    ctx.fillText(entry.direction, x, y);
    x += ctx.measureText(entry.direction).width + 5;
    if (entry.platform) {
        ctx.fillText(`(Gl. ${entry.platform})`, x, y);
        x += ctx.measureText(`(Gl. ${entry.platform})`).width;
    }
    return x;
};

const createPublicTransportOverlay = async data => {
    const canvas = createCanvas(1280, 960);
    const ctx = canvas.getContext('2d');
    ctx.font = 'bold 16px OpenSans';
    ctx.fillStyle = 'black';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'top';
    const now = new Date().toLocaleTimeString('de-DE', { hour: 'numeric', minute: '2-digit' });
    ctx.fillText(data.name, 30, 30);
    let lastWidth = ctx.measureText(data.name).width + 20;
    ctx.font = '16px OpenSans';
    let x = 45;
    let y = 65;
    for (let entry of data.departures) {
        const width = await addDeparture(ctx, entry, x, y);
        y += 30;
        if (width > lastWidth) {
            lastWidth = width;
        }
    }
    ctx.font = '24px OpenSans';
    const nowWidth = ctx.measureText(now).width;
    ctx.fillText(now, lastWidth - nowWidth, 30);
    ctx.globalCompositeOperation = 'destination-over';
    ctx.fillStyle = '#d9d9d9cc';
    roundRect(ctx, 20, 20, lastWidth - 10, y - 15, 6);
    return canvas.toBuffer('image/png');
};

/**
 * Send layer as file
 * @see https://eyeson-team.github.io/api/api-reference/#content-integration-aka-layers
 */
 const sendLayerAsFile = async (buffer, zIndex = '1') => {
    const client = meeting.getClient();
    if (!client) {
        return;
    }
    const blob = new Blob([buffer], { type: 'image/png' });
    const formData = new FormData();
    formData.append('file', blob, 'image.png');
    formData.append('z-index', zIndex);
    await fetch(`https://api.eyeson.team/rooms/${client.accessKey}/layers`, { method: 'POST', body: formData });
};

const applyTextLayer = async (title = '', content = '', icon = '') => {
    const client = meeting.getClient();
    if (client) {
        const insert = { content };
        if (title) {
            insert.title = title;
        }
        if (icon) {
            insert.icon = icon;
        }
        await client.setLayer({ insert });
    }
};

/**
 * set layer by url
 */
const applyImageLayer = async (url, zIndex = '1') => {
    const client = meeting.getClient();
    if (client) {
        await client.setLayer({ url, 'z-index': zIndex });
    }
};

/**
 * clear layer
 */
 const clearLayer = async (zIndex = '1') => {
    const client = meeting.getClient();
    if (client) {
        await client.clearLayer(zIndex);
    }
};

export default {
    createPublicTransportOverlay,
    sendLayerAsFile,
    applyTextLayer,
    applyImageLayer,
    clearLayer
};
