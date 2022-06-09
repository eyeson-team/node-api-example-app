<script>
    import { onMount } from 'svelte';
    import { toasts } from 'svelte-toasts';
    import CurlButton from './CurlButton.svelte';
    import api from '../api.js';

    const customPlaybackUrl = 'https://storage.googleapis.com/eyeson-demo/playground/videos/demo-video.webm';
    let playbackUrl = customPlaybackUrl;
    let playbackAudio = true;
    let loading = false;
    let localVideoSelect = null;
    let localVideos = [];

    const sendPlayback = async () => {
        loading = true;
        try {
            await api.post('/playback', { url: playbackUrl, audio: playbackAudio });
        } catch (error) {
            toasts.error(error.toString());
        }
        loading = false;
    };

    const onSelectLocalVideo = ({ target }) => {
        playbackUrl = target.value;
    };

    const onPlaybackInput = () => {
        if (Array.from(localVideoSelect.options, option => option.value).includes(playbackUrl)) {
            localVideoSelect.value = playbackUrl;
        } else {
            localVideoSelect.value = customPlaybackUrl;
        }
    };

    onMount(async () => {
        try {
            const list = await api.get('/playback');
            localVideos = list.map(entry => entry.url);
        } catch (e) {
        }
    });
</script>

<section>
    <fieldset>
        <legend>Playback</legend>
        <form on:submit|preventDefault={sendPlayback}>
            {#if localVideos.length > 0}
                <p>
                    <label><span class="noselect">Video</span>
                        <select on:change={onSelectLocalVideo} bind:this={localVideoSelect}>
                            <option value={customPlaybackUrl}>Custom</option>
                            {#each localVideos as video}
                                <option value={new URL(video, location.origin).href}>{video}</option>
                            {/each}
                        </select>
                    </label>
                </p>
            {/if}
            <p>
                <label><span class="noselect">Playback URL</span> <input type="url" bind:value={playbackUrl} on:input={onPlaybackInput} placeholder="https://storage.googleapis.com/eyeson-demo/playground/videos/demo-video.webm" disabled={loading} /></label>
                <label><input type="checkbox" bind:checked={playbackAudio} disabled={loading} /> <span class="noselect">incl. sound</span></label>
                <button type="submit" disabled={loading}>Play</button>
                <CurlButton path="playback" params={`url=${playbackUrl}&audio=${playbackAudio}`} />

            </p>
        </form>
    </fieldset>
</section>