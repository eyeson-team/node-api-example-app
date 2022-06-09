<script>
    import { toasts } from 'svelte-toasts';
    import ShareButton from './ShareButton.svelte';
	import api from '../api.js';

    let username = '';
    let loading = false;
    let participants = [];

    const joinParticipant = async () => {
        loading = true;
        try {
            const data = await api.post('/join', { user: username });
            participants = [...participants, data];
            username = '';
        } catch (error) {
            toasts.error(error.toString());
        }
        loading = false;
    };
</script>

<section>
    <h2>Participants</h2>
    {#each participants as participant}
        <p><b>{participant.userName}</b> <a href="{participant.links.gui}" target="_blank">{participant.links.gui}</a> <ShareButton content={participant.links.gui} /></p>
    {/each}
    <form on:submit|preventDefault={joinParticipant}>
        <p>
            <label><span class="noselect">Name</span> <input type="text" bind:value={username} disabled={loading} required /></label>
            <button type="submit" disabled={loading}>Join</button>
        </p>
    </form>
</section>