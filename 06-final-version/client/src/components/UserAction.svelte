<script>
    import { onMount, onDestroy } from 'svelte';
    import { toasts } from 'svelte-toasts';
    import api from '../api.js';
    import sse from '../sse.js';

    let loading = false;
    let active = false;
    export let webhookActive = false;
    
    const onStatusUpdate = event => {
        const data = JSON.parse(event.data);
        active = data.active;
    };

    const updateStatus = async () => {
        loading = true;
        try {
            await api.post('/user-action', { active });
        } catch (error) {
            toasts.error(error.toString());
        }
        loading = false;
    };
    
    onMount(async () => {
        sse.on('user-action', onStatusUpdate);
        api.get('/user-action').then(result => active = result.active);
    });

    onDestroy(() => {
        sse.off('user-action', onStatusUpdate);
    });
</script>

<section>
    <fieldset>
        <legend>User Action</legend>
        <p><label><input type="checkbox" bind:checked={active} on:change={updateStatus} disabled={!webhookActive || loading} /> <span class="noselect">Play random "hello" giphy when participant joins</span></label></p>
    </fieldset>
</section>
