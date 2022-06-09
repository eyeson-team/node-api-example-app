<script>
    import { createEventDispatcher } from 'svelte';
    export let participants = [];
    export let selected = '';
    export let id = '';

    const dispatch = createEventDispatcher();

    const onChangeTrigger = () => {
        dispatch('change', { value: selected, id });
    };

</script>

<select bind:value={selected} on:change={onChangeTrigger}>
    <option value="">-</option>
    {#each participants as participant}
        <option value="{participant.id}">{participant.name}</option>
    {/each}
    <option value="playback-demo">playback</option>
</select>
