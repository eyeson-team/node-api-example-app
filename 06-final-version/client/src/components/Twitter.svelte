<script>
    import { onMount, onDestroy } from 'svelte';
    import { toasts } from 'svelte-toasts';
    import api from '../api.js';
    import sse from '../sse.js';

    let ready = false;
    let streamLoading = false;
    let streamStatus = '';
    let streamFilter = '';
    
    const onStreamUpdate = event => {
        const data = JSON.parse(event.data);
        applyState(data);
    };

    const applyState = data => {
        if (data.type === 'status') {
            streamStatus = data.status;
            streamFilter = data.filter;
        }
    };
    
    onMount(async () => {
        sse.on('twitter-stream', onStreamUpdate);
        api.get('/twitter/status').then(data => ready = data.ready);
        const data = await api.get('/twitter/stream');
        applyState(data);
    });

    onDestroy(() => {
        sse.off('twitter-stream', onStreamUpdate);
    });

    const startStream = async () => {
        streamLoading = true;
        try {
            await api.post('/twitter/stream', { filter: streamFilter });
        } catch (error) {
            toasts.error(error.toString());
        }
        streamLoading = false;
    };

    const stopStream = async () => {
        streamLoading = true;
        try {
            await api.delete('/twitter/stream');
        } catch (error) {
            toasts.error(error.toString());
        }
        streamLoading = false;
    };

</script>

<section>
    <fieldset>
        <legend>Twitter Stream</legend>
        {#if ready}
            <form on:submit|preventDefault={startStream}>
                {#if streamStatus !== ''}
                    <p>Current state: <output class={streamStatus}><i>{streamStatus}</i></output></p>
                {/if}
                <p>
                    <label><span class="noselect">Filter</span> <input type="text" bind:value={streamFilter} placeholder="#WeAreDevs" disabled={streamStatus !== '' || streamLoading} required /></label>
                    {#if streamStatus === ''}
                        <button type="submit" disabled={streamLoading}>Start</button>
                    {:else}
                        <button type="button" on:click={stopStream} disabled={streamLoading || streamStatus === 'closed'} class="delete">Stop</button>
                    {/if}
                </p>
            </form>
        {:else}
            <p>Missing Twitter API tokens. Please register at <a href="https://developer.twitter.com" target="_blank">https://developer.twitter.com</a> and store tokens in <tt>.env</tt> file.</p>
        {/if}
    </fieldset>
</section>

<style>
output.init {
    color: orange;
}
output.connected {
    color: green;
}
</style>