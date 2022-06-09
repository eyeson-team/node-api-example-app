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

## Chapter: 04 Layer

This chapter demonstrates the layer feature of eyeson. You can create a background and a foreground layer.

- start/stop meeting
- register/remove webhook
- join participants
- set layer with options
  - simple text
  - static images
- dynamically created images (public transport)

 ## Public during tests

You can use [ngrok](https://ngrok.com/) to make your application public by creating a secure tunnel to your application server:

```sh
$ ngrok http 8080
```

You will get a URL of the form https://a1b2c3d4.ngrok.io which you can register as your webhook during testing phase.

The webhook endpoint in this demo is `/webhook`, so in this case the URL is `https://a1b2c3d4.ngrok.io/webhook`.

## More information

There are 3 ways to apply them.

1. Send text and the foreground layer is created automatically
2. Send public URL of static images and set as foreground or background layer
3. Send the generated image file as binary

Read more details about this feature:
- https://eyeson-team.github.io/api/api-reference/#content-integration-aka-layers
