import meeting from './meeting.js';

/**
 * Layout
 * set layout by options
 * @see https://eyeson-team.github.io/api/api-reference/#layout
 * @see https://techblog.eyeson.team/posts/podium-layouts/
 */

const applyLayout = async (name, users, showNames, autofill) => {
    const client = meeting.getClient();
    if (!client) {
        return;
    }
    const params = {
        layout: 'auto',
        show_names: showNames,
        voice_activation: true
    };
    if (name !== 'auto') {
        if (autofill === false) {
            params.layout = 'custom';
            params.voice_activation = false;
        }
        params.name = name;
        params.users = users;
    }
    await client.setLayout(params);
};

export default { applyLayout };