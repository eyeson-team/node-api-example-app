import meeting from './meeting.js';

/**
 * Virtual rooms
 * Uses a combination of layout and layers to create virtual looking rooms
 * @see https://eyeson-team.github.io/api/api-reference/#layout
 * @see https://eyeson-team.github.io/api/api-reference/#content-integration-aka-layers
 */

const demos = {
    auto: {
        foregroundLayer: '',
        backgroundLayer: '',
        layout: {
            layout: 'auto',
            voice_activation: true,
            show_names: true
        }
    },
    lesson: {
        foregroundLayer: 'https://storage.googleapis.com/eyeson-demo/pictures/lecture-fg.png',
        backgroundLayer: 'https://storage.googleapis.com/eyeson-demo/pictures/lecture-bg.jpg',
        layout: {
            layout: 'auto',
            name: 'experimental',
            users: ['', '', '', '', '', '', '', '', '', ''],
            voice_activation: true,
            show_names: false
        },
        userMapping: {
            teacher: 1,
            chalkboard: 0
        }
    },
    watchParty: {
        foregroundLayer: 'https://storage.googleapis.com/eyeson-demo/pictures/movie-fg.png',
        backgroundLayer: 'https://storage.googleapis.com/eyeson-demo/pictures/movie-bg-ph.jpg',
        layout: {
            layout: 'auto',
            name: 'present-upper-3-bg',
            users: ['', '', '', ''],
            voice_activation: true,
            show_names: false
        },
        userMapping: {
            cinema: 0
        }
    },
    news: {
        foregroundLayer: 'https://storage.googleapis.com/eyeson-demo/pictures/news-fg1.png',
        backgroundLayer: 'https://storage.googleapis.com/eyeson-demo/pictures/news-bg.jpg',
        layout: {
            layout: 'auto',
            name: 'present-one-bg',
            users: ['', ''],
            voice_activation: true,
            show_names: false
        },
        userMapping: {
            presenter: 0
        }
    },
    discussion: {
        foregroundLayer: 'https://storage.googleapis.com/eyeson-demo/pictures/company-fg.png',
        backgroundLayer: 'https://storage.googleapis.com/eyeson-demo/pictures/company-bg-ph.jpg',
        layout: {
            layout: 'auto',
            name: 'present-center-four-bg',
            users: ['', '', '', ''],
            voice_activation: true,
            show_names: false
        },
        userMapping: {}
    },
    gameplay: {
        foregroundLayer: 'https://storage.googleapis.com/eyeson-demo/pictures/game-fg.png',
        backgroundLayer: 'https://storage.googleapis.com/eyeson-demo/pictures/game-bg-ph2.jpg',
        layout: {
            layout: 'auto',
            name: 'mobile-center-8',
            users: ['', '', '', 'placeholder2', 'placeholder3', '', '', 'placeholder4', 'placeholder5'],
            voice_activation: true,
            show_names: false
        },
        userMapping: {
            game: 0
        }
    },
    healthcare: {
        foregroundLayer: 'https://storage.googleapis.com/eyeson-demo/pictures/healthcare-fg.png',
        backgroundLayer: 'https://storage.googleapis.com/eyeson-demo/pictures/healthcare-bg.png',
        layout: {
            layout: 'custom',
            name: 'present-upper-3-bg',
            users: ['', '', '', ''],
            voice_activation: false,
            show_names: false
        },
        userMapping: {
            presentation: 0,
            doctor: 1,
            patient: 2
        }
    },
    chess: {
        foregroundLayer: 'https://storage.googleapis.com/eyeson-demo/pictures/chess-fg.png',
        backgroundLayer: null,
        layout: {
            layout: 'custom',
            name: 'nine',
            users: ['', '', '', '', '', '', '', '', ''],
            voice_activation: false,
            show_names: false
        },
        userMapping: {
            white: 0,
            black: 2
        }
    }
};

const applyLayout = async (demo, users) => {
    const client = meeting.getClient();
    if (!client) {
        return;
    }
    const selectedDemo = demos[demo];
    const selectedLayout = selectedDemo.layout;
    selectedLayout.users.fill('');
    Object.entries(users).forEach(([key, userId]) => {
        const id = selectedDemo.userMapping[key];
        selectedLayout.users[id] = userId;
    });
    await client.setLayout(selectedLayout);
    await Promise.all([
        client.setLayer({ url: selectedDemo.foregroundLayer, 'z-index': '1' }),
        selectedDemo.backgroundLayer
            ? client.setLayer({ url: selectedDemo.backgroundLayer, 'z-index': '-1' })
            : client.clearLayer('-1')
    ]);
};

const clearLayout = async () => {
    const client = meeting.getClient();
    if (!client) {
        return;
    }
    await client.setLayout(demos.auto.layout);
    await Promise.all([
        client.clearLayer('1'),
        client.clearLayer('-1')
    ]);
};

export default {
    applyLayout, clearLayout
};
