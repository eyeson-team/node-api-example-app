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

## Chapter: 5 Virtual Room

This chapter demonstrates the combination of layout, layer, and playback features of eyeson. You can choose between different virtual rooms and assign users to important positions.

**Heads-up!** webhook with type `participant_update` is required to retrive each user_id in order to assign participants.

- start/stop meeting
- register/remove webhook
- join participants
- set predefined virtual room with assigned positions
- start playback
 
## Public during tests

You can use [ngrok](https://ngrok.com/) to make your application public by creating a secure tunnel to your application server:

```sh
$ ngrok http 8080
```

You will get a URL of the form https://a1b2c3d4.ngrok.io which you can register as your webhook during testing phase.

The webhook endpoint in this demo is `/webhook`, so in this case the URL is `https://a1b2c3d4.ngrok.io/webhook`.

## More information

More details can be found here:
- https://eyeson-team.github.io/api/api-reference/#layout
- https://eyeson-team.github.io/api/api-reference/#content-integration-aka-layers