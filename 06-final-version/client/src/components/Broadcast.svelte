<script>
    import { onMount, onDestroy } from 'svelte';
    import { toasts } from 'svelte-toasts';
    import CurlButton from './CurlButton.svelte';
    import api from '../api.js';
    import sse from '../sse.js';

    let active = false;
    let streamUrl = '';
    let loading = false;

    const startBroadcast = async () => {
        loading = true;
        try {
            await api.post('/broadcast', { streamUrl });
        } catch (error) {
            toasts.error(error.toString());
        }
        loading = false;
    };

    const stopBroadcast = async () => {
        loading = true;
        try {
            await api.delete('/broadcast');
        } catch (error) {
            toasts.error(error.toString());
        }
        loading = false;
    };

    const onBroadcastUpdate = event => {
        const current = JSON.parse(event.data);
        active = current.active;
        streamUrl = current.streamUrl;
    };
    
    onMount(async () => {
        sse.on('broadcast', onBroadcastUpdate);
        const current = await api.get('/broadcast');
        active = current.active;
        streamUrl = current.streamUrl;
    });

    onDestroy(() => {
        sse.off('broadcast', onBroadcastUpdate);
    });
</script>

<section>
    <fieldset>
        <legend>Broadcast</legend>
        <form on:submit|preventDefault={startBroadcast}>
            <p><a href="https://app.restream.io/channel" target="_blank">https://app.restream.io/channel</a></p>
            <p>
                <label><span class="noselect">Stream URL</span> <input type="url" bind:value={streamUrl} disabled={loading || active} placeholder="rtmp://" required /></label>
                <button type="submit" disabled={loading || active}>Start</button>
                {#if active}
                    <button type="button" class="delete" on:click={stopBroadcast} disabled={loading}>Stop</button>
                {/if}
                <CurlButton path={`broadcast/${active ? 'stop' : 'start'}`} params={`url=${streamUrl}`} />
            </p>
        </form>
    </fieldset>
</section>
