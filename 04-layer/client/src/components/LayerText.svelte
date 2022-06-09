<script>
    import { toasts } from 'svelte-toasts';
    import api from '../api.js';

    let icon = '';
    let title = '';
    let content = '';
    let loading = false;

    const applyLayer = async () => {
		loading = true;
        try {
            await api.post('/layer/text', { title, content, icon });
        } catch (error) {
            toasts.error(error.toString());
        }
        loading = false;
    };

    const deleteLayer = async () => {
        loading = true;
        try {
            await api.delete('/layer/1');
        } catch (error) {
            toasts.error(error.toString());
        }
        loading = false;
    };
</script>

<section>
    <fieldset>
        <legend>Layer text</legend>
        <form on:submit|preventDefault={applyLayer}>
            <p><label><span class="noselect">Icon (URL)</span> <input type="url" bind:value={icon} placeholder="https://" disabled={loading} /></label></p>
            <p><label><span class="noselect">Title</span> <input type="text" bind:value={title} disabled={loading} /></label></p>
            <p><label><span class="noselect">Content</span> <input type="text" bind:value={content} disabled={loading} /></label></p>
            <p><i>Hint: HTML formatting is supported.</i></p>
            <p>
                <button type="submit" disabled={loading}>Apply</button>
                <button type="button" class="delete" on:click={deleteLayer} disabled={loading}>Delete</button>
            </p>
        </form>
    </fieldset>
</section>
