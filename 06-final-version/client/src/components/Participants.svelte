<script>
    import { toasts } from 'svelte-toasts';
    import ShareButton from './ShareButton.svelte';
    import api from '../api.js';

	let username = '';
	let loading = false;
    let participants = [];
	
	const joinUser = async () => {
		const user = username.trim();
		loading = true;
        try {
            const data = await api.post('/join', { user });
            participants = [...participants, data];
            username = '';
        } catch (error) {
            toasts.error(error.toString());
        }
        loading = false;
	};
</script>

<section>
    <fieldset>
        <legend>Participants</legend>
        <p><a href="https://eyeson-team.github.io/react-web-gui-example/" target="_blank">https://eyeson-team.github.io/react-web-gui-example/</a></p>
        {#each participants as participant}
            <p><b>{participant.userName}</b> <a href="{participant.links.gui}" target="_blank">{participant.links.gui}</a> <ShareButton content={participant.links.gui} /></p>
        {/each}
        <form on:submit|preventDefault={joinUser}>
            <p>
                <label><span class="noselect">Username</span> <input type="text" bind:value={username} disabled={loading} required /></label>
                <button type="submit" disabled={loading}>Join</button>
            </p>
        </form>
    </fieldset>
</section>
