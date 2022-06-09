<script>
    import { onMount, onDestroy } from 'svelte';
    import { toasts } from 'svelte-toasts';
    import api from '../api.js';
    import sse from '../sse.js';

    const userId = 'ghost-rtsp';
    let state = '';
    let url = 'rtsp://109.236.111.203/axis-media/media.amp'; // 'rtsp://213.34.225.97/axis-media/media.amp';

    const applyState = data => {
        if (data.running) {
            state = data.status;
        } else {
            state = '';
        }
    };

    const onRtspUpdate = event => {
        const data = JSON.parse(event.data);
        applyState(data);
    };
    
    onMount(async () => {
        sse.on('ghost-rtsp', onRtspUpdate);
        const data = await api.get('/rtsp');
        applyState(data);
    });

    onDestroy(() => {
        sse.off('ghost-rtsp', onRtspUpdate);
    });

    const start = async () => {
        state = 'init';
        try {
            await api.post('/rtsp', { src: url });
        } catch (error) {
            state = '';
            toasts.error(error.toString());
        }
    };
    
    const stop = async () => {
        await api.delete('/rtsp');
    };

    const setPresentLayout = async () => {
        await api.post('/layout', { name: 'present-upper-6-aspect-fit', users: [userId], showNames: true });
    };

    const setFullscreenLayout = async () => {
        await api.post('/layout', { name: 'aspect-fit', users: [userId], showNames: true });
    };
</script>

<section>
    <form on:submit|preventDefault={start}>
        <fieldset>
            <legend>RTSP</legend>
            <p><label><input type="url" bind:value={url} placeholder="rtsp://" disabled={state !== ''} /></label></p>
            {#if state === ''}
                <p>
                    <button type="submit">Start</button>
                </p>
            {:else}
                <p>
                    <button type="button" class="delete" on:click={stop}>Stop</button>
                    Status: <output class={state}><i>{state}</i></output>
                </p>
                <p>
                    <button type="button" on:click={setPresentLayout} disabled={state !== 'streaming'}>Set present layout</button>
                    <button type="button" on:click={setFullscreenLayout} disabled={state !== 'streaming'}>Set fullscreen layout</button>
                </p>
            {/if}
        </fieldset>
    </form>
</section>

<style>
output.init {
    color: orange;
}
output.streaming {
    color: green;
}
</style>    