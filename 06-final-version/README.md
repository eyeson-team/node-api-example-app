# W-A-D Workshop Demo

This is a demo for workshop #2 at [We-Are-Developers World Congress 2022](https://www.wearedevelopers.com/world-congress).

Workshop has the title __"video meeting on steroids"__ and it shows/explains how you can control and interact with meeting content.

Server code is written with [nodejs](https://nodejs.dev/) and the client uses the [Svelte](https://svelte.dev/) framework.

## Setup

```sh
$ npm install
$ cp .env.example .env
$ npm start
```

Get your API key from https://developers.eyeson.team/ and add it to your `.env` file.

**Client**

Make sure to navigate to the client folder and follow (README)[./client/README.md] instructions for setup.

## Chapter: 6 Final version

This chapter contains all features from previous chapters and even more.

**Heads-up!** webhook with types `recording_update`, `snapshot_update`, and `participant_update` are required. To use the [twitter](https://developer.twitter.com/) functionality, you need valid keys and add them to your `.env` file.

- start/stop meeting
- register/remove webhook
- join participants
- set layer with options
- set layout with options
- set predefined virtual room with assigned positions
- create snapshot
- snapshots are downloaded to server automatically
- auto tweet snapshot incl. participant names
- start/stop recording
- recordings are downloaded to the server automatically
- start playback
- playback video files from server
- start/stop broadcast
- play hello giphy when participant joins
- Twitter filtered stream as overlay
- public transport departures as overlay
- ghost RTMP/RTSP clients

## Ghost Streaming client

In this chapter the ghost streaming client for rtmp and rtsp is used. In order to use them you have to download binary files for your system and place them in folder `/bin`.

https://github.com/eyeson-team/ghost/releases

## Public during tests

You can use [ngrok](https://ngrok.com/) to make your application public by creating a secure tunnel to your application server:

```sh
$ ngrok http 8080
```

You will get a URL of the form https://a1b2c3d4.ngrok.io which you can register as your webhook during testing phase.

The webhook endpoint in this demo is `/webhook`, so in this case the URL is `https://a1b2c3d4.ngrok.io/webhook`.

## More information

More details can be found here:

- https://developers.eyeson.team/
- https://eyeson-team.github.io/api/api-reference/
- https://github.com/eyeson-team/ghost
- https://techblog.eyeson.team/

## Questions

If you have any questions, please use the issue tracker on github so that other users can also benefit from it.

https://github.com/eyeson-team/api/issues