<script>
	import { ToastContainer, BootstrapToast, toasts } from 'svelte-toasts';
	import Webhook from './components/Webhook.svelte';
	import Meeting from './components/Meeting.svelte';
	import StartMeeting from './components/StartMeeting.svelte';
	import { onMount } from 'svelte';
	import api from './api.js';
	import sse from './sse.js';

	let apiReady = false;
	let activeMeeting = false;
	let meetingData = null;

	const initServerSentEvents = () => {
		sse.on('meeting', event => {
			const { type, data } = JSON.parse(event.data);
			if (type === 'start') {
				meetingData = data;
				activeMeeting = true;
			}
			else if (type === 'exit') {
				activeMeeting = false;
				meetingData = null;
				toasts.info('Meeting has ended');
			}
		});
	};

	onMount(async () => {
		initServerSentEvents();
		api.get('/api/status').then(data => apiReady = data.ready);
		const { active, data } = await api.get('/meeting');
		activeMeeting = active;
		meetingData = data;
	});
</script>

<main>
	<header id="app-header">
		<div class="brand"><img src="/eyeson-logo.svg" width="120" height="39.2" alt="eyeson - developers" /></div>
		<div class="title">
			<h1>video meeting on steroids</h1>
			<h2>live data, layout hacks and automated tasks</h2>
		</div>
	</header>

	{#if apiReady}
		{#if activeMeeting}
			<Meeting {meetingData} />
		{:else}
			<StartMeeting />
		{/if}
		<Webhook />
	{:else}
		<h2>Missing API key!</h2>
		<p>Get your API key from <a href="https://developers.eyeson.team/" target="_blank">https://developers.eyeson.team/</a> and add it to your <tt>.env</tt> file.</p>
	{/if}
</main>
<ToastContainer let:data={data} placement="top-center" theme="light">
	<BootstrapToast {data} />
</ToastContainer>
