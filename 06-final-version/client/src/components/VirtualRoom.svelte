<script>
    import { onMount, onDestroy } from 'svelte';
	import { toasts } from 'svelte-toasts';
    import ParticipantSelect from './ParticipantSelect.svelte';
    import api from '../api.js';
    import sse from '../sse.js';

    let participants = [];
    let selectedDemo = '';
    let loading = false;
    const demos = {
        lesson: {
            name: 'Online Lesson',
            users: {
                chalkboard: 'playback-demo',
                teacher: ''
            }
        },
        watchParty: {
            name: 'Watch Party',
            users: {
                cinema: 'playback-demo'
            }
        },
        news: {
            name: 'News',
            users: {
                presenter: 'playback-demo'
            }
        },
        discussion: {
            name: 'Panel discussion',
            users: {}
        },
        gameplay: {
            name: 'Mobile gameplay',
            users: {
                game: 'playback-demo'
            }
        },
        healthcare: {
            name: 'Healthcare',
            users: {
                presentation: 'playback-demo',
                doctor: '',
                patient: ''
            }
        },
        chess: {
            name: 'eyeson chess',
            users: {
                white: '',
                black: ''
            }
        }
    };

    const ucfirst = str => str.charAt(0).toUpperCase() + str.slice(1);
    
    const onParticipantUpdate = event => {
        const data = JSON.parse(event.data);
        if (data.type === 'add') {
            participants = [...participants, data.participant];
        } else if (data.type === 'remove') {
            const { id } = data.participant;
            participants = participants.filter(p => p.id !== id);
            checkRemovedParticipant(id);
        }
    };

    const checkSelectedParticipants = ({ detail: select }) => {
        const currentUsers = demos[selectedDemo].users;
        Object.keys(currentUsers).filter(key => key !== select.id).forEach(key => {
            if (currentUsers[key] === select.value) {
                currentUsers[key] = '';
            }
        });
        currentUsers[select.id] = select.value;
        demos[selectedDemo].users = currentUsers;
    };

    const checkRemovedParticipant = removedParticipantId => {
        if (!demos[selectedDemo]) return;
        const currentUsers = demos[selectedDemo].users;
        Object.keys(currentUsers).forEach(key => {
            if (currentUsers[key] === removedParticipantId) {
                currentUsers[key] = '';
            }
        });
        demos[selectedDemo].users = currentUsers;
    };

    const applyLayout = async () => {
        loading = true;
        try {
            await api.post('/virtual-room', {
                demo: selectedDemo,
                users: demos[selectedDemo].users
            });
        } catch (error) {
            toasts.error(error.toString());
        }
        loading = false;
    };

    const clearLayout = async () => {
        loading = true;
        try {
            await api.delete('/virtual-room');
            selectedDemo = '';
        } catch (error) {
            toasts.error(error.toString());
        }
        loading = false;
    };
    
    onMount(async () => {
        sse.on('members', onParticipantUpdate);
        participants = await api.get('/members');
    });

    onDestroy(() => {
        sse.off('members', onParticipantUpdate);
    });
</script>

<section>
    <fieldset>
        <legend>Virtual Room</legend>
        <p><label><span class="noselect">Demo</span> <select bind:value={selectedDemo}>
            <option value="">Choose…</option>
            {#each Object.entries(demos) as [id, demo]}
                <option value={id}>{demo.name}</option>
            {/each}
        </select></label></p>
        {#if selectedDemo !== ''}
            <p><b>{demos[selectedDemo].name}</b></p>
            {#each Object.entries(demos[selectedDemo].users) as [id, userId]}
                <p>{ucfirst(id)}: <ParticipantSelect {participants} selected={userId} id={id} on:change={checkSelectedParticipants} /></p>
            {/each}
            <p><button type="button" on:click={applyLayout} disabled={loading}>Apply</button></p>
            <p><button type="button" on:click={clearLayout} disabled={loading} class="delete">Clear layout</button></p>
        {/if}
    </fieldset>
</section>