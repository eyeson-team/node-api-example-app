<script>
    import { toasts } from 'svelte-toasts';
    import CurlButton from './CurlButton.svelte';
    import api from '../api.js';

    let foregroundUrl = 'https://eyeson-team.github.io/api/images/eyeson-overlay.png';
    let backgroundUrl = 'https://eyeson-team.github.io/api/images/eyeson-background.png';
    let foregroundLoading = false;
    let backgroundLoading = false;

    const applyForeground = async () => {
        foregroundLoading = true;
        try {
            await api.post('/layer/1', { url: foregroundUrl });
        } catch (error) {
            toasts.error(error.toString());
        }
        foregroundLoading = false;
    };

    const applyBackground = async () => {
        backgroundLoading = true;
        try {
            await api.post('/layer/-1', { url: backgroundUrl });
        } catch (error) {
            toasts.error(error.toString());
        }
        backgroundLoading = false;
    };

    const deleteForeground = async () => {
        foregroundLoading = true;
        try {
            await api.delete('/layer/1');
        } catch (error) {
            toasts.error(error.toString());
        }
        foregroundLoading = false;
    };

    const deleteBackground = async () => {
        backgroundLoading = true;
        try {
            await api.delete('/layer/-1');
        } catch (error) {
            toasts.error(error.toString());
        }
        backgroundLoading = false;
    };
</script>

<section>
    <fieldset>
        <legend>Layer</legend>
        <form on:submit|preventDefault={applyForeground}>
            <p>
                <label><span class="noselect">Foreground</span> <input type="url" bind:value={foregroundUrl} disabled={foregroundLoading} /></label>
                <button type="submit" disabled={foregroundLoading}>Apply</button>
                <button type="button" class="delete" disabled={foregroundLoading} on:click={deleteForeground}>Delete</button>
            </p>
        </form>
        <form on:submit|preventDefault={applyBackground}>
            <p>
                <label><span class="noselect">Background</span> <input type="url" bind:value={backgroundUrl} disabled={backgroundLoading} /></label>
                <button type="submit" disabled={backgroundLoading}>Apply</button>
                <button type="button" class="delete" disabled={backgroundLoading} on:click={deleteBackground}>Delete</button>
            </p>
        </form>
        <p><CurlButton path="/layer" params={`url=${backgroundUrl}&zIndex=-1`} /></p>
    </fieldset>
</section>