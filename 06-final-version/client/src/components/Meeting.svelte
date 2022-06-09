<script>
    import QrCode from 'svelte-qrcode';
    import ShareButton from './ShareButton.svelte';
    import Participants from './Participants.svelte';
    import Playback from './Playback.svelte';
    import Snapshots from './Snapshots.svelte';
    import Recordings from './Recordings.svelte';
    import Rtmp from './Rtmp.svelte';
    import Rtsp from './Rtsp.svelte';
    import Twitter from './Twitter.svelte';
    import LayoutManager from './LayoutManager.svelte';
    import VirtualRoom from './VirtualRoom.svelte';
    import Broadcast from './Broadcast.svelte';
    import UserAction from './UserAction.svelte';
    import CurlButton from './CurlButton.svelte';
    import Layer from './Layer.svelte';
    import PublicTransport from './PublicTransport.svelte';
    import api from '../api.js';

    export let meetingData = null;
    export let webhookActive = false;
    
    const stopMeeting = async () => {
        await api.delete('/meeting');
    };

    const setAutoLayout = async () => {
        await api.post('/layout', { name: 'auto', show_names: true });
    };

</script>

<section>
    <div id="meeting-info" style="overflow:hidden">
        <p style="float:right"><QrCode value={meetingData.links.guest_join} /></p>
        <p>GUI link: <a href="{meetingData.links.gui}" target="_blank">{meetingData.links.gui}</a> <ShareButton content={meetingData.links.gui} /></p>
        <p>Guest link: <a href="{meetingData.links.guest_join}" target="_blank">{meetingData.links.guest_join}</a> <ShareButton content={meetingData.links.guest_join} /></p>
        <p><button type="button" class="delete" on:click={stopMeeting}>Stop meeting</button></p>
        <p>
            <button type="button" on:click={setAutoLayout}>Set auto layout</button>
            <CurlButton path="layout" params="layout=auto" />
        </p>
    </div>

    <Participants />
    <Recordings />
    <Snapshots {webhookActive} />
    <Twitter />
    <Layer />
    <LayoutManager />
    <VirtualRoom />
    <Playback />
    <UserAction {webhookActive} />
    <PublicTransport />
    <Broadcast />
    <Rtmp />
    <Rtsp />
</section>