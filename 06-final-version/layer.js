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

const removeEmojiCharacters = str =>
    str.replace(/([\uE000-\uF8FF]|\uD83C[\uDF00-\uDFFF]|\uD83D[\uDC00-\uDDFF])\s*/g, '');

// https://codepen.io/nishiohirokazu/pen/jjNyye
const wrapText = (context, text, x, y, maxWidth, lineHeight) => {
    text = removeEmojiCharacters(text);
    const lines = text.split('\n');
    for (let i = 0, k = lines.length; i < k; i++) {
        const words = lines[i].split(' ');
        let line = '';
        for (let n = 0; n < words.length; n++) {
            const testLine = line + words[n] + ' ';
            const { width } = context.measureText(testLine);
            if (width > maxWidth && n > 0) {
                context.fillText(line, x, y);
                line = words[n] + ' ';
                y += lineHeight;
            }
            else {
                line = testLine;
            }
        }
        context.fillText(line, x, y);
        y += lineHeight;
    }
    return y - lineHeight;
};

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

const circleImage = async (context, url, x, y, size) => {
    try {
        const img = await loadImage(url);
        const radius = size / 2;
        context.save();
        context.beginPath();
        context.arc(x + radius, y + radius, radius, 0, Math.PI * 2);
        context.clip();
        context.drawImage(img, x, y, size, size);
        context.restore();
    } catch (error) {
        console.error('layer::circleImage', error);
    }
};

const formatTime = dateString => {
	const date = new Date(dateString);
	return date.toLocaleTimeString('de-DE', { hour:'numeric', minute:'2-digit' })
		+ ' · '
		+ date.toLocaleDateString('de-DE', { day: 'numeric', month: 'short', year: 'numeric' });
};

const addMedia = async (context, media, x, y, maxWidth) => {
	if (media && media[0].url && media[0].url.endsWith('.jpg')) {
        try {
            const img = await loadImage(media[0].url);
            const { width, height } = img;
            const w = Math.min(width, maxWidth);
            const h = height / width * w;
            context.drawImage(img, x, y, w, h);
            return y + h - 20;
        } catch (error) {
            console.error('layer::addMedia', error);
            return y - 25;
        }
	}
	return y - 25;
};

const addTwitterLogo = async context => {
    try {
        const img = await loadImage('./assets/images/twitter-logo.png');
        context.drawImage(img, 892, 20);
    } catch (error) {
        console.error('layer::addTwitterLogo', error);
    }
};

const createTwitterOverlay = async tweet => {
    const canvas = createCanvas(1280, 960);
    const ctx = canvas.getContext('2d');
    const user = tweet.includes.users[0];
	await addTwitterLogo(ctx);
	await circleImage(ctx, user.profile_image_url, 970, 30, 50);
    ctx.fillStyle = 'black';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'top';
    ctx.font = 'bold 16px OpenSans';
    ctx.fillText(user.name, 1030, 30, 220);
    ctx.font = '16px OpenSans';
    ctx.fillStyle = '#444';
    ctx.fillText('@' + user.username, 1030, 50, 220);
    ctx.fillStyle = 'black';
    let lastTop = wrapText(ctx, tweet.data.text, 970, 80, 280, 20);
	ctx.font = '14px OpenSans';
    ctx.fillStyle = '#444';
	lastTop += 25;
	ctx.fillText(formatTime(tweet.data.created_at), 970, lastTop, 280);
	lastTop = await addMedia(ctx, tweet.includes.media, 970, lastTop + 25, 280);
    ctx.globalCompositeOperation = 'destination-over';
    ctx.fillStyle = '#d9d9d9cc';
    roundRect(ctx, 960, 20, 300, lastTop + 10, 6);
    return canvas.toBuffer('image/png');
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

/**
 * set layer by url
 */
const applyLayer = async (url, zIndex = '1') => {
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

const createCurl = (url, zIndex) => {
    const client = meeting.getClientInfo();
    return `curl -X POST \\
-d "url=${url}" \\
-d "z-index=${zIndex}" \\
https://api.eyeson.team/rooms/${client.accessKey}/layers`;
};

export default {
    createTwitterOverlay,
    createPublicTransportOverlay,
    sendLayerAsFile,
    applyLayer,
    clearLayer,
    createCurl
};
