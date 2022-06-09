<script>
    import { toasts } from 'svelte-toasts';
    
    export let content = '';
    export let type = 'url'; // or text
    const supportShare = !!navigator.share;

    const onCopy = async () => {
        try {
            await navigator.clipboard.writeText(content);
            toasts.success('Copied!');
        } catch (error) {
            console.error(error);
            toasts.error('Error! Unable to copy.');
        }
    };

    const onShare = async () => {
        try {
            const options = {};
            if (type === 'url') {
                options.url = content;
            } else {
                options.text = content;
            }
            await navigator.share(options);
        } catch (error) {
            if (error.name !== 'AbortError') {
                console.error(error);
                toasts.error('Error! Unable to share.');
            }
        }
    };
</script>

<button type="button" on:click={onCopy} title="Copy">
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
        <path d="M19 21H8V7h11m0-2H8a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h11a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2m-3-4H4a2 2 0 0 0-2 2v14h2V3h12V1Z" fill="currentColor" />
    </svg>
</button>
{#if supportShare}
    <button type="button" on:click={onShare} title="Share">
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
            <path d="M18 16.08c-.76 0-1.44.3-1.96.77L8.91 12.7c.05-.23.09-.46.09-.7 0-.24-.04-.47-.09-.7l7.05-4.11c.54.5 1.25.81 2.04.81a3 3 0 0 0 3-3 3 3 0 0 0-3-3 3 3 0 0 0-3 3c0 .24.04.47.09.7L8.04 9.81C7.5 9.31 6.79 9 6 9a3 3 0 0 0-3 3 3 3 0 0 0 3 3c.79 0 1.5-.31 2.04-.81l7.12 4.15c-.05.21-.08.43-.08.66 0 1.61 1.31 2.91 2.92 2.91 1.61 0 2.92-1.3 2.92-2.91A2.92 2.92 0 0 0 18 16.08Z" fill="currentColor" />
        </svg>
    </button>
{/if}

<style>
    button svg {
        width: 1em;
        height: 1em;
    }
</style>