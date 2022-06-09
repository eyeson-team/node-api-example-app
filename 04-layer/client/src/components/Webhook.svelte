<script>
    import { onMount, createEventDispatcher } from 'svelte';
    import { toasts } from 'svelte-toasts';
    import api from '../api.js';
    import sse from '../sse.js';

    const dispatch = createEventDispatcher();
    let webhook = null;
    let webhookUrl = '';
    let loading = false;

    onMount(async () => {
        sse.on('webhook', event => {
            const data = JSON.parse(event.data);
            webhook = data;
            dispatch('statusChange', Boolean(webhook));
        });
        const data = await api.get('/hook');
        webhook = data;
        dispatch('statusChange', Boolean(webhook));
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

    const testWebhook = async () => {
        try {
            const response = await fetch(webhook.url, {
                method: 'POST',
                headers: {
                    'Content-type': 'application/json',
                    'X-Eyeson-Signature': '24a8f1a68008134d5d524a60d8753ada5238788240187d5131920cfc8a0f4baa'
                },
                body: JSON.stringify({ type: 'test' })
            });
            if (response.status !== 201) {
                toasts.error('Failed! Webhook is not working');
                return;
            }
            toasts.success('Webhook is working');
        } catch (error) {
            toasts.error('Failed! Webhook is not working');
        }
    };
</script>

<section>
    <fieldset>
        <legend>Webhook</legend>
        {#if webhook}
            <p>
                Webhook registered <tt>{webhook.url}</tt>
                <button type="button" class="delete" on:click={removeWebhook} disabled={loading}>Remove</button>
                <button type="button" on:click={testWebhook}>Test</button>
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