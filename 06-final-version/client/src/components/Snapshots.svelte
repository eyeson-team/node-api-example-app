<script>
    import { onMount, onDestroy } from 'svelte';
    import { toasts } from 'svelte-toasts';
    import CurlButton from './CurlButton.svelte';
    import api from '../api.js';
    import sse from '../sse.js';

    let twitterReady = false;
    let snapshots = [];
    let loading = false;
    let autoTweet = false;
    let loadingAutoTweet = false;
    export let webhookActive = false;
    
    const createSnapshot = async () => {
        loading = true;
        try {
            await api.post('/snapshot');
        } catch (error) {
            toasts.error(error.toString());
        }
        loading = false;
    };

    const onSnapshotUpdate = event => {
        const current = JSON.parse(event.data);
        snapshots = [...snapshots, current];
    };

    const onSnapshotTwitterUpdate = event => {
        const data = JSON.parse(event.data);
        autoTweet = data.active;
    };

    const updateAutoTweet = async () => {
        loadingAutoTweet = true;
        try {
            await api.post('/snapshot/twitter', { active: autoTweet });
        } catch (error) {
            toasts.error(error.toString());
        }
        loadingAutoTweet = false;
    };
    
    onMount(async () => {
        sse.on('snapshot', onSnapshotUpdate);
        sse.on('snapshot-twitter', onSnapshotTwitterUpdate);
        api.get('/snapshot').then(result => snapshots = result);
        api.get('/snapshot/twitter').then(result => autoTweet = result.active);
        api.get('/twitter/status').then(data => twitterReady = data.ready);
    });

    onDestroy(() => {
        sse.off('snapshot', onSnapshotUpdate);
        sse.off('snapshot-twitter', onSnapshotTwitterUpdate);
    });
</script>

<section>
    <fieldset>
        <legend>Snapshots</legend>
        <p>
            <button type="button" on:click={createSnapshot} disabled={loading}>Snapshot</button>
            <CurlButton path="snapshot" />
        </p>
        {#if snapshots.length > 0}
            <ul id="list-snapshots">
                {#each snapshots as snapshot}
                    <li><a href="{snapshot.url}" target="_blank"><img src="{snapshot.url}" width="128" height="96" alt="snapshot" /></a></li>
                {/each}
            </ul>
        {/if}
        {#if twitterReady}
            <p><label><input type="checkbox" bind:checked={autoTweet} on:change={updateAutoTweet} disabled={!webhookActive || loadingAutoTweet} /> <span class="noselect">Auto tweet snapshot</span></label></p>
        {/if}
    </fieldset>
</section>

<style>
#list-snapshots {
    display: flex;
    gap: 1rem;
    flex-wrap: wrap;
    list-style: none;
}
#list-snapshots img {
    vertical-align: middle;
}
</style>