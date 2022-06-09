import dotenv from 'dotenv';
import fetch from 'node-fetch';

const dirname = new URL('../', import.meta.url).pathname;
dotenv.config({ path: dirname + '.env' });
const { log } = console;
const apiKey = process.env.API_KEY;
const endpoint = 'https://api.eyeson.team/webhooks';

const getExisting = async () => {
    const response = await fetch(endpoint, {
        headers: { 'Authorization': apiKey }
    });
    return await response.json();
};

const removeWebhook = async id => {
    const response = await fetch(`${endpoint}/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': apiKey }
    });
    if (response.ok) {
        log('Removed existing webhook');
    } else {
        log(response.statusText);
    }
};

const registerWebhook = async webhook => {
    const existing = await getExisting();
    if (existing) {
        if (existing.url === webhook) {
            log('Same webhook is already registered');
            return;
        }
        await removeWebhook(existing.id); // need to remove, no override unfortunately
    }
    const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
            'Authorization': apiKey,
            'Content-type': 'application/json'
        },
        body: JSON.stringify({
            url: webhook,
            types: 'room_update,recording_update,participant_update,snapshot_update'
        })
    });
    if (response.ok) {
        log('Registered ' + webhook);
    } else {
        log(response.statusText);
    }
};

const run = async () => {
    const webhook = process.argv[2];
    if (!webhook) {
        console.error('Missing URL');
        return;
    }
    await registerWebhook(webhook);
};

run();