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

## Chapter: 2 Webhooks

This chapter explains how webhooks are used. Here we focus on 2 types, `room_update` and `recording_update`.

- register/remove webhook
- start/stop meeting
- join participants
- start/stop recording
- recordings are downloaded to the server automatically

### room_update, recording_update

`room_update` is triggered whenever a state of a meeting has changed. Most important states are `ready` and `shutdown`.

`recording_update` is only triggered when a recording process has ended and the video file is ready to be used.

### Webhook cli helper scripts

Even though the functionality is available in the app itself, we have added some cli helper scripts to register/remove webhooks from the commandline.
You can find these in `./scripts/getWebhook.js`, `./scripts/registerWebhook.js`, and `./scripts/removeWebhook.js`.

## Public during tests

You can use [ngrok](https://ngrok.com/) to make your application public by creating a secure tunnel to your application server:

```sh
$ ngrok http 8080
```

You will get a URL of the form https://a1b2c3d4.ngrok.io which you can register as your webhook during testing phase.

The webhook endpoint in this demo is `/webhook`, so in this case the URL is `https://a1b2c3d4.ngrok.io/webhook`.

## More information

More details can be found here:
- https://eyeson-team.github.io/api/api-reference/#register-webhooks