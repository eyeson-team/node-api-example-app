<script>
    import ShareButton from './ShareButton.svelte';
    import api from '../api.js';

    export let path = '';
    export let params = '';
    let curl = '';
    let coloredCurl = '';

    const getCurl = async () => {
        let query = `/curl/${path}`;
        if (params) {
            query += '?' + params;
        }
        const { cmd } = await api.get(query);
        curl = cmd;
        coloredCurl = highlight(curl);
    };

    const close = () => {
        curl = '';
        coloredCurl = '';
    };

    const highlight = text => {
        return text
            .replace(/(\".+?\")/g, '<span class="string">$1</span>')
            .replace('curl', '<span class="function">curl</span>');
    };
</script>

<button type="button" on:click={getCurl}>Snippet</button>
{#if curl !== ''}
    <div class="modal-container">
        <div class="modal-popup">
            <h1>curl {path}</h1>
            <pre class="curl"><code>{@html coloredCurl}</code></pre>
            <p>
                <button type="button" on:click={close}>Close</button>
                <ShareButton content={curl} type="text" />
            </p>
        </div>
    </div>
{/if}
