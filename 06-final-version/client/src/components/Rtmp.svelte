<script>
    import { onMount, onDestroy } from 'svelte';
    import { toasts } from 'svelte-toasts';
    import api from '../api.js';
    import sse from '../sse.js';

    const userId = 'ghost-rtmp';
    let state = ''; // 'init', 'listen'
    let ipAdresses = null;

    const applyState = data => {
        if (data.running) {
            state = data.status;
            ipAdresses = data.ips;
        } else {
            state = '';
            ipAdresses = null;
        }
    };

    const onRtmpUpdate = event => {
        const data = JSON.parse(event.data);
        applyState(data);
    };
    
    onMount(async () => {
        sse.on('ghost-rtmp', onRtmpUpdate);
        const data = await api.get('/rtmp');
        applyState(data);
    });

    onDestroy(() => {
        sse.off('ghost-rtmp', onRtmpUpdate);
    });

    const start = async () => {
        state = 'init';
        try {
            await api.post('/rtmp');
        } catch (error) {
            state = '';
            toasts.error(error.toString());
        }
    };
    
    const stop = async () => {
        await api.delete('/rtmp');
    };

    const setPresentLayout = async () => {
        await api.post('/layout', { name: 'present-upper-6-aspect-fit', users: [userId], showNames: true });
    };

    const setFullscreenLayout = async () => {
        await api.post('/layout', { name: 'aspect-fit', users: [userId], showNames: true });
    };
</script>

<section>
    <fieldset>
        <legend>RTMP</legend>
        {#if state === ''}
            <p>
                <button type="button" on:click={start}>Start</button>
            </p>
        {:else}
            <p>
                <button type="button" class="delete" on:click={stop}>Stop</button>
                Status: <output class={state}><i>{state}</i></output>
                {#if Array.isArray(ipAdresses)}
                    <output>{ipAdresses.map(ip => `rtmp://${ip}/live`).join(', ')}</output>
                {/if}
            </p>
            <p>
                <button type="button" on:click={setPresentLayout} disabled={state !== 'listen'}>Set present layout</button>
                <button type="button" on:click={setFullscreenLayout} disabled={state !== 'listen'}>Set fullscreen layout</button>
            </p>
    {/if}
    </fieldset>
</section>

<style>
output.init {
    color: orange;
}
output.listen {
    color: green;
}
</style>