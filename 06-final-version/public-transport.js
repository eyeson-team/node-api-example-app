import fetch from 'node-fetch';
import layer from './layer.js';
import sse from './sse.js';

/**
 * Public transport data overlay
 * 3rd party live data integration demo
 * refresh every second
 * @see https://v5.bvg.transport.rest/api.html
 */

const _api = 'https://v5.bvg.transport.rest';

let status = { active: false, station: 'S Messe Süd' };
let interval = null;
let stationData = null;

const start = () => {
    interval = setInterval(createAndSendInfo, 60 * 1000);
    createAndSendInfo();
};

const createAndSendInfo = async () => {
    stationData.departures = await getDepartures(stationData.id);
    const buffer = await layer.createPublicTransportOverlay(stationData);
    await layer.sendLayerAsFile(buffer, '1');
};

const getDepartures = async id => {
    const response = await fetch(`${_api}/stops/${id}/departures?duration=10&remarks=false&pretty=false`);
    const data = await response.json();
    const result = [];
    if (data.length > 0) {
        data.forEach(entry => {
            const displayTime = new Date(entry.plannedWhen).toLocaleTimeString('de-DE', { hour: 'numeric', minute: '2-digit' });
            const delay = entry.delay !== null ? Math.round(entry.delay / 60) : 0;
            result.push({
                delay,
                departure: displayTime,
                type: entry.line.product,
                line: entry.line.name,
                direction: entry.direction,
                platform: entry.plannedPlatform
            });
        });
    }
    return result;
};

const stop = async () => {
    clearInterval(interval);
    layer.clearLayer();
};

const getStatus = () => status;

const setStatus = async (active, station = '') => {
    if (status.active !== active) {
        if (active) {
            const stations = await searchStation(station);
            if (stations.length === 0) {
                throw new Error('Invalid data');
            }
            stationData = stations[0];
            stationData.departures = [];
            status.station = station;
            status.active = active;
            sse.send('public-transport', status);
            start();
        } else {
            stop();
            stationData = null;
            status.active = active;
            sse.send('public-transport', status);
        }
    }
};

const searchStation = async query => {
    const response = await fetch(`${_api}/stops?query=${decodeURIComponent(query)}&pretty=false`);
    const result = await response.json();
    return result;
};

export default {
    getStatus, setStatus, searchStation, stop
};
