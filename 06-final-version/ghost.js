import { spawn } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import sse from './sse.js';

/**
 * ghost RTMP/RTSP streaming clients
 * start/stop stream into current meeting
 * @see https://github.com/eyeson-team/ghost
 * @see https://github.com/eyeson-team/ghost/releases/
 * @see https://github.com/eyeson-team/ghost/tree/main/examples/rtmp-server
 * @see https://github.com/eyeson-team/ghost/tree/main/examples/rtsp-client
 */

const platform = process.env.npm_config_platform || os.platform();
const arch = process.env.npm_config_arch || os.arch();
const rtspEventName = 'ghost-rtsp';
const rtmpEventName = 'ghost-rtmp';
const lookup = {
    win32: 'windows',
    x64: 'amd64'
};
const generateBinaryName = name => {
    return `${name}_${lookup[platform] || platform}_${lookup[arch] || arch}${platform === 'win32' ? '.exe' : ''}`;
};

const rtsp = {
    binary: generateBinaryName('rtsp-client'),
    childProcess: null,
    state: {
        running: false,
        status: ''
    },
    start: (src, guestLink) => {
        if (rtsp.childProcess) {
            throw new Error('Already running');
        }
        if (fs.existsSync(`./bin/${rtsp.binary}`) === false) {
            throw new Error('Missing binary');
        }
        rtsp.state.running = true;
        rtsp.state.status = 'init';
        sse.send(rtspEventName, rtsp.state);
        const params = ['--user-id', 'ghost-rtsp', guestLink, src];
        rtsp.childProcess = spawn('./' + rtsp.binary, params, { cwd: './bin' });
        rtsp.childProcess.stderr.setEncoding('utf8');
        rtsp.childProcess.stderr.on('data', data => {
            if (data.includes('Webrtc connected')) {
                rtsp.state.status = 'streaming';
                sse.send(rtspEventName, rtsp.state);
            }
        });
        rtsp.childProcess.on('error', error => {
            console.error('ghost error', error);
        });
        rtsp.childProcess.on('exit', () => {
            rtsp.childProcess = null;
            rtsp.state.running = false;
            rtsp.state.status = '';
            sse.send(rtspEventName, rtsp.state);
        });
    },
    stop: () => {
        if (rtsp.childProcess) {
            rtsp.childProcess.kill();
            rtsp.childProcess = null;
        }
    }
};

const rtmp = {
    binary: generateBinaryName('rtmp-server'),
    childProcess: null,
    state: {
        running: false,
        status: '',
        ips: null
    },
    start: guestLink => {
        if (rtmp.childProcess) {
            throw new Error('Already running');
        }
        if (fs.existsSync(`./bin/${rtmp.binary}`) === false) {
            throw new Error('Missing binary');
        }
        rtmp.state.running = true;
        rtmp.state.status = 'init';
        rtmp.state.ips = null;
        sse.send(rtmpEventName, rtmp.state);
        const params = ['--user-id', 'ghost-rtmp', guestLink];
        rtmp.childProcess = spawn('./' + rtmp.binary, params, { cwd: './bin' });
        rtmp.childProcess.stderr.setEncoding('utf8');
        rtmp.childProcess.stderr.on('data', data => {
            // console.log(data);
            if (data.includes('RTMP server listening')) {
                rtmp.state.status = 'listen';
                rtmp.state.ips = getLocalIPs();
                sse.send(rtmpEventName, rtmp.state);
            }
        });
        rtmp.childProcess.on('error', error => {
            console.error('ghost error', error);
        });
        rtmp.childProcess.on('exit', () => {
            rtmp.childProcess = null;
            rtmp.state.running = false;
            rtmp.state.status = '';
            rtmp.state.ips = null;
            sse.send(rtmpEventName, rtmp.state);
        });
    },
    stop: () => {
        if (rtmp.childProcess) {
            rtmp.childProcess.kill();
            rtmp.childProcess = null;
        }
    }
};

// https://stackoverflow.com/questions/3653065/get-local-ip-address-in-node-js
const getLocalIPs = () => {
    const interfaces = Object.values(os.networkInterfaces()).flat().filter(entry => entry.family === 'IPv4' && !entry.internal && entry.address);
    if (interfaces.length > 0) {
        return interfaces.map(entry => entry.address);
    }
    return null;
}

export default {
    rtsp, rtmp
};