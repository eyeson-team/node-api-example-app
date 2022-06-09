<script>
    import QrCode from 'svelte-qrcode';
    import ShareButton from './ShareButton.svelte';
    import Recordings from './Recordings.svelte';
    import api from '../api.js';

    export let meetingData = null;
    
    const stopMeeting = async () => {
        await api.delete('/meeting');
    };
</script>

<section>
    <div id="meeting-info" style="overflow:hidden">
        <p style="float:right"><QrCode value={meetingData.links.guest_join} /></p>
        <p>GUI link: <a href="{meetingData.links.gui}" target="_blank">{meetingData.links.gui}</a> <ShareButton content={meetingData.links.gui} /></p>
        <p>Guest link: <a href="{meetingData.links.guest_join}" target="_blank">{meetingData.links.guest_join}</a> <ShareButton content={meetingData.links.guest_join} /></p>
        <p><button type="button" class="delete" on:click={stopMeeting}>Stop meeting</button></p>
    </div>

    <Recordings />
</section>