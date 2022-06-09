<script>
    import { onMount } from 'svelte';
    import { toasts } from 'svelte-toasts';
    import api from '../api.js';
    import sse from '../sse.js';

    let webhook = null;
    let webhookUrl = '';
    let loading = false;

    onMount(async () => {
        sse.on('webhook', event => {
            const data = JSON.parse(event.data);
            webhook = data;
        });
        const data = await api.get('/hook');
        webhook = data;
    });

    const registerWebhook = async () => {
        loading = true;
        try {
            await api.post('/hook', { url: webhookUrl });
        } catch (error) {
            toasts.error(error.toString());
        }
        loading = false;
    };

    const removeWebhook = async () => {
        loading = true;
        try {
            await api.delete('/hook');
            webhookUrl = '';
        } catch (error) {
            toasts.error(error.toString());
        }
        loading = false;
    };
</script>

<section>
    <fieldset>
        <legend>Webhook</legend>
        {#if webhook}
            <p>
                Webhook registered <tt>{webhook.url}</tt>
                <button type="button" class="delete" on:click={removeWebhook} disabled={loading}>Remove</button>
            </p>
        {:else}
            <form on:submit|preventDefault={registerWebhook}>
                <p>
                    <label><span class="noselect">Webhook URL</span> <input type="url" bind:value={webhookUrl} placeholder="https://" required disabled={loading} /></label>
                    <button type="submit" disabled={loading}>Register</button>
                </p>
            </form>
        {/if}
    </fieldset>
</section>