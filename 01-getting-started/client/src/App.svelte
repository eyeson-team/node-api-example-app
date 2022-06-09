<script>
	import { onMount } from 'svelte';
	import { ToastContainer, BootstrapToast, toasts } from 'svelte-toasts';
    import ShareButton from './components/ShareButton.svelte';
    import Participants from './components/Participants.svelte';
	import api from './api.js';

	let apiReady = false;
    let meetingData = null;
    let username = '';
    let loading = false;

    const startMeeting = async () => {
        loading = true;
        try {
            meetingData = await api.post('/meeting', { user: username });
        } catch (error) {
            toasts.error(error.toString());
        }
        loading = false;
    };
    
    const stopMeeting = async () => {
        loading = true;
        try {
            await api.delete('/meeting');
            meetingData = await api.get('/meeting');
        } catch (error) {
            toasts.error(error.toString());
        }
        loading = false;
    };
    
	const focusOnInit = node => {
		if (node && typeof node.focus === 'function') {
			node.focus();
		}
	};

    onMount(async () => {
		api.get('/api/status').then(data => apiReady = data.ready);
        meetingData = await api.get('/meeting');
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
        {#if meetingData}
            <p>Meeting is running.</p>
            <p>GUI link: <a href="{meetingData.links.gui}" target="_blank">{meetingData.links.gui}</a> <ShareButton content={meetingData.links.gui} /></p>
            <p>Guest link: <a href="{meetingData.links.guest_join}" target="_blank">{meetingData.links.guest_join}</a> <ShareButton content={meetingData.links.guest_join} /></p>
            <p><button type="button" class="delete" on:click={stopMeeting} disabled={loading}>Stop meeting</button></p>
            <Participants />
        {:else}
            <p>No active meeting yet. To start a new meeting, enter your name and join.</p>
            <form on:submit|preventDefault={startMeeting}>
                <p>
                    <label><span class="noselect">Name</span> <input type="text" bind:value={username} disabled={loading} use:focusOnInit required /></label>
                    <button type="submit" disabled={loading}>Start</button>
                </p>
            </form>
        {/if}
    {:else}
		<h2>Missing API key!</h2>
		<p>Get your API key from <a href="https://developers.eyeson.team/" target="_blank">https://developers.eyeson.team/</a> and add it to your <tt>.env</tt> file.</p>
	{/if}
</main>

<ToastContainer let:data={data} placement="top-center" theme="light">
    <BootstrapToast {data} />
</ToastContainer>
