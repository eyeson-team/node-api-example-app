<script>
    import api from '../api.js';
    import CurlButton from './CurlButton.svelte';

	let username = '';
	let status = '';
	let loading = false;
	
	const onSubmit = () => {
		const user = username.trim();
		if (!user) {
			status = 'Name is required';
			return;
		}
		join(user);
	};

	const join = async user => {
		loading = true;
		status = 'Joining, please wait.';
        try {
            await api.post('/meeting', { user });
            loading = false;
			status = '';
        } catch (error) {
			loading = false;
			status = error.toString();
        }
	};

	const focusOnInit = node => {
		if (node && typeof node.focus === 'function') {
			node.focus();
		}
	};
</script>

<main>
	<form on:submit|preventDefault={onSubmit}>
        <p><label>
            <span class="noselect">Enter your name</span>
            <input type="text" bind:value={username} disabled={loading} use:focusOnInit required />
        </label></p>
        <p>
			<button type="submit" disabled={loading}>Start meeting</button>
			<CurlButton path="meeting" params={'user=' + (username || 'John Doe')} />
		</p>
        {#if status}
        	<p>{status}</p>
      	{/if}
    </form>
</main>
