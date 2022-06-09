<script>
    import { onMount, onDestroy } from 'svelte';
    import { toasts } from 'svelte-toasts';
    import api from '../api.js';
    import sse from '../sse.js';

    let recordings = [];
    let loading = false;
    let active = false;
    
    const startRecording = async () => {
        loading = true;
        try {
            await api.post('/recording');
        } catch (error) {
            toasts.error(error.toString());
        }
        loading = false;
    };

    const stopRecording = async () => {
        loading = true;
        try {
            await api.delete('/recording');
        } catch (error) {
            toasts.error(error.toString());
        }
        loading = false;
    };

    const onRecordingUpdate = event => {
        const state = JSON.parse(event.data);
        active = state.active;
    };
    
    const onRecordingsUpdate = event => {
        const current = JSON.parse(event.data);
        recordings = [...recordings, current];
    };
    
    onMount(async () => {
        sse.on('recording', onRecordingUpdate);
        sse.on('recordings', onRecordingsUpdate);
        api.get('/recording').then(state => active = state.active);
        api.get('/recordings').then(result => recordings = result);

    });

    onDestroy(() => {
        sse.off('recording', onRecordingUpdate);
        sse.off('recordings', onRecordingsUpdate);
    });
</script>

<section>
    <fieldset>
        <legend>Recordings</legend>
        <p>
            <button type="button" on:click={startRecording} disabled={loading || active}>Start</button>
            {#if active}
                <button type="button" class="delete" on:click={stopRecording} disabled={loading}>Stop</button>
            {/if}
        </p>
        {#if recordings.length > 0}
            <ul id="list-recordings">
                {#each recordings as record}
                    <li><a href="{record.url}" target="_blank">{record.url}</a></li>
                {/each}
            </ul>
        {/if}
    </fieldset>
</section>

<style>
#list-recordings {
    margin-left: 2.5rem;
}
</style>