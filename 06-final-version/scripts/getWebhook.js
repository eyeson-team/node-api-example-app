import dotenv from 'dotenv';
import fetch from 'node-fetch';

const dirname = new URL('../', import.meta.url).pathname;
const { log } = console;

dotenv.config({ path: dirname + '.env' });

const apiKey = process.env.API_KEY;
const endpoint = 'https://api.eyeson.team/webhooks';

const getExisting = async () => {
    const response = await fetch(endpoint, {
        headers: { 'Authorization': apiKey }
    });
    return await response.json();
};

const run = async () => {
    const existing = await getExisting();
    log(existing);
};

run();
