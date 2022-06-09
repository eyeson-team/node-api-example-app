<script>
    import { onMount, onDestroy } from 'svelte';
	import { toasts } from 'svelte-toasts';
    import ParticipantSelect from './ParticipantSelect.svelte';
    import api from '../api.js';
    import sse from '../sse.js';

    let participants = [];
    let selectedLayout = 'auto';
    let showNames = true;
    let autofill = false;
    let loading = false;
    const layouts = {
        auto: {
            name: 'auto',
            users: []
        },
        one: {
            name: 'one',
            users: new Array(1).fill('')
        },
        four: {
            name: 'four',
            users: new Array(4).fill('')
        },
        nine: {
            name: 'nine',
            users: new Array(9).fill('')
        },
        'present-lower-3': {
            name: 'present-lower-3',
            users: new Array(4).fill('')
        },
        'present-upper-6': {
            name: 'present-upper-6',
            users: new Array(7).fill('')
        },
        'present-two-upper-6': {
            name: 'present-two-upper-6',
            users: new Array(8).fill('')
        }
    };

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
        const currentUsers = layouts[selectedLayout].users;
        currentUsers.forEach((userId, index) => {
            if (index !== select.id && userId === select.value) {
                currentUsers[index] = '';
            }
        });
        currentUsers[select.id] = select.value;
        layouts[selectedLayout].users = currentUsers;
    };

    const checkRemovedParticipant = removedParticipantId => {
        Object.values(layouts).forEach(layout => {
            const currentUsers = layout.users;
            let changed = false;
            currentUsers.forEach((userId, index) => {
                if (userId === removedParticipantId) {
                    currentUsers[index] = '';
                    changed = true;
                }
            });
            if (changed) {
                layouts[layout.name].users = currentUsers;
            }
        });
    };

    const applyLayout = async () => {
        loading = true;
        const params = Object.assign({ showNames, autofill }, layouts[selectedLayout]);
        try {
            await api.post('/layout', params);
        } catch (error) {
            console.error(error);
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
        <legend>Layout Manager</legend>
        <p><label><span class="noselect">Layout</span> <select bind:value={selectedLayout}>
            {#each Object.keys(layouts) as id}
                <option>{id}</option>
            {/each}
        </select></label></p>
        <div id="users" class={selectedLayout}>
            {#each layouts[selectedLayout].users as user, index}
                <span>
                    <ParticipantSelect {participants} selected={user} id={index} on:change={checkSelectedParticipants} />
                </span>
            {/each}
        </div>
        <p><label><span class="noselect">Show names</span> <input type="checkbox" bind:checked={showNames} /></label></p>
        <p><label><span class="noselect">Autofill empty places</span> <input type="checkbox" bind:checked={autofill} disabled={selectedLayout === 'auto'} /></label></p>
        <p><button type="button" on:click={applyLayout} disabled={loading}>Apply layout</button></p>
    </fieldset>
</section>

<style>
#users span {
    display: grid;
}
#users:not(:empty) {
    width: fit-content;
    padding: 20px;
    gap: 20px;
    background: #404040;
    border: 1px solid #cdcdcd;
}
#users.four {
    display: grid;
    grid-template: repeat(2, 1fr) / repeat(2, max-content);
}
#users.nine {
    display: grid;
    grid-template: repeat(3, 1fr) / repeat(3, max-content);
}
#users.present-lower-3 {
    display: grid;
    grid-template: repeat(2, 1fr) / repeat(3, max-content);
}
#users.present-lower-3 span:first-child {
    grid-column: 1 / -1;
    grid-row: 2 / -1;
}
#users.present-upper-6 {
    display: grid;
    grid-template: repeat(2, 1fr) / repeat(6, max-content);
}
#users.present-upper-6 span:first-child {
    grid-column: 1 / -1;
}
#users.present-two-upper-6 {
    display: grid;
    grid-template: repeat(2, 1fr) / repeat(6, max-content);
}
#users.present-two-upper-6 span:first-child {
    grid-column: 1 / 4;
}
#users.present-two-upper-6 span:nth-child(2) {
    grid-column: 4 / -1;
}
</style>