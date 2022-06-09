<script>
    import { onMount, onDestroy } from 'svelte';
    import { toasts } from 'svelte-toasts';
    import api from '../api.js';
    import sse from '../sse.js';

    let loading = false;
    let active = false;
    let station = 'S Messe Süd';
    let suggestionElement = null;
    
    const onStatusUpdate = event => {
        const data = JSON.parse(event.data);
        active = data.active;
        station = data.station;
    };

    const onStationInput = async ({ target }) => {
        try {
            const query = target.value.trim();
            if (query === '') {
                return;
            }
            const result = await api.get('/public-transport/search?station=' + encodeURIComponent(query));
            suggestionElement.innerHTML = result.map(entry => `<option>${entry.name}</option>`);
        } catch (error) {
            console.error(error);
        }
    };

    const start = async () => {
        loading = true;
        try {
            await api.post('/public-transport', { station });
        } catch (error) {
            toasts.error(error.toString());
        }
        loading = false;
    };

    const stop = async () => {
        loading = true;
        try {
            await api.delete('/public-transport');
        } catch (error) {
            toasts.error(error.toString());
        }
        loading = false;
    };
    
    onMount(async () => {
        sse.on('public-transport', onStatusUpdate);
        api.get('/public-transport').then(result => {
            active = result.active;
            station = result.station;
        });
    });

    onDestroy(() => {
        sse.off('public-transport', onStatusUpdate);
    });
</script>

<section>
    <form on:submit|preventDefault={start}>
        <fieldset>
            <legend>Public Transport</legend>
            <p>
                <label><input type="text" bind:value={station} on:input={onStationInput} placeholder="S Messe Süd" disabled={active} autocomplete="off" list="station-suggestion" required /></label>
                <datalist id="station-suggestion" bind:this={suggestionElement}></datalist>
                <button type="submit" disabled={loading || active}>Start</button>
                {#if active}
                    <button type="button" class="delete" on:click={stop} disabled={loading}>Stop</button>
                {/if}
            </p>
    </fieldset>
    </form>
</section>
