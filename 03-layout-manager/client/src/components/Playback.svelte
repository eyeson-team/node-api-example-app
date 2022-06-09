<script>
    import { toasts } from 'svelte-toasts';
    import api from '../api.js';

    let playbackUrl = 'https://storage.googleapis.com/eyeson-demo/playground/videos/demo-video.webm';
    let playbackAudio = true;
    let loading = false;

    const sendPlayback = async () => {
        loading = true;
        try {
            await api.post('/playback', { url: playbackUrl, audio: playbackAudio });
        } catch (error) {
            toasts.error(error.toString());
        }
        loading = false;
    };
</script>

<section>
    <fieldset>
        <legend>Playback</legend>
        <form on:submit|preventDefault={sendPlayback}>
            <p>
                <label><span class="noselect">Playback URL</span> <input type="url" bind:value={playbackUrl} placeholder="https://storage.googleapis.com/eyeson-demo/playground/videos/demo-video.webm" disabled={loading} /></label>
                <label><input type="checkbox" bind:checked={playbackAudio} disabled={loading} /> <span class="noselect">incl. sound</span></label>
                <button type="submit" disabled={loading}>Play</button>
            </p>
        </form>
    </fieldset>
</section>