import { TwitterApi, ETwitterStreamEvent } from 'twitter-api-v2';
import sse from './sse.js';
import layer from './layer.js';
import meeting from './meeting.js';
import participants from './participants.js';

/**
 * Twitter
 * start/stop event stream, tweet snapshot
 */

const appClient = (() => {
    try {
        return new TwitterApi(process.env.TWITTER_BEARER_TOKEN);
    } catch (error) {
        return null;
    }
})();
const userClient = (() => {
    try {
        return new TwitterApi({
            appKey: process.env.TWITTER_CONSUMER_KEY,
            appSecret: process.env.TWITTER_CONSUMER_SECRET,
            accessToken: process.env.TWITTER_ACCESS_TOKEN_KEY,
            accessSecret: process.env.TWITTER_ACCESS_TOKEN_SECRET
        });
    } catch (error) {
        return null;
    }
})();
const _streamStatus = { type: 'status', status: '', filter: '' };
let _stream = null;
let _overlayTimer = null;

const getStatus = () => {
    return Boolean(appClient && userClient);
};

/**
 * Twitter "filtered stream" feature
 * @see https://developer.twitter.com/en/docs/twitter-api/tweets/filtered-stream/introduction
 */
const startEventStream = async filter => {
    setStreamStatus('init', filter);
    try {
        const rules = await appClient.v2.streamRules();
        if (rules.data?.length) {
            await appClient.v2.updateStreamRules({
                delete: { ids: rules.data.map(rule => rule.id) }
            });
        }
        await appClient.v2.updateStreamRules({
            add: [{ value: filter }]
        });
        _stream = await appClient.v2.searchStream({
            'expansions': ['author_id', 'attachments.media_keys'],
            'tweet.fields': ['created_at', 'attachments'],
            'user.fields': ['username', 'name', 'profile_image_url'],
            'media.fields': ['preview_image_url', 'url']
        });
        _stream.autoReconnect = true;
        _stream.on(ETwitterStreamEvent.Data, async data => {
            clearTimeout(_overlayTimer);
            const buffer = await layer.createTwitterOverlay(data);
            await layer.sendLayerAsFile(buffer);
            clearTimeout(_overlayTimer);
            _overlayTimer = setTimeout(() => layer.clearLayer(), 10 * 1000);
        });
        setStreamStatus('connected', filter);
    } catch (error) {
        console.error(error);
        setStreamStatus('closed');
        stopEventStream();
    }
};

const setStreamStatus = (status, filter = '') => {
    _streamStatus.status = status;
    _streamStatus.filter = filter;
    sse.send('twitter-stream', _streamStatus);
    if (status === 'closed') {
        setTimeout(() => setStreamStatus(''), 3000);
    }
};

const stopEventStream = () => {
    if (_stream) {
        _stream.destroy();
        _stream = null;
        setStreamStatus('closed');
    }
};

const getStreamStatus = () => _streamStatus;

/**
 * Twitter post a tweet incl media
 * @see https://developer.twitter.com/en/docs/twitter-api/tweets/manage-tweets/introduction
 * @see https://developer.twitter.com/en/docs/twitter-api/v1/media/upload-media/overview
 */
const tweetSnapshot = async buffer => {
    try {
        const message = getTweetMessage();
        const mediaId = await userClient.v1.uploadMedia(buffer, { mimeType: 'image/jpg' });
        await userClient.v2.tweet(message, { media: { media_ids: [mediaId] } });
    } catch (error) {
        console.error(error);
    }
};

const listFormatter = new Intl.ListFormat('en', { style: 'long', type: 'conjunction' });

const getTweetMessage = () => {
    const { roomName = '' } = meeting.getClientInfo();
    const userNames = participants.getParticipantList().map(entry => entry.name);
    if (roomName && userNames.length > 0) {
        return `Live snapshot from eyeson meeting ${roomName} with ${listFormatter.format(userNames)} - learn more at @eyeson_team #WeAreDevs2022 #WeAreDevs`;
    }
    return 'Live snapshot post from an @eyeson_team meeting via eyeson API #WeAreDevs2022 #WeAreDevs';
};

export default {
    getStatus, startEventStream, stopEventStream, getStreamStatus, tweetSnapshot
};