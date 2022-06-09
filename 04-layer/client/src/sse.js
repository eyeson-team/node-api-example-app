let sse = null;

const init = () => {
    if (sse) {
        return;
    }
    sse = new EventSource('/sse');
};

const on = (type, cb) => {
    init();
    if (sse) {
        sse.addEventListener(type, cb);
    }
};

const off = (type, cb) => {
    if (sse) {
        sse.removeEventListener(type, cb);
    }
};

export default { init, on, off };