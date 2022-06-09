const api = {
    get: async path => {
        const response = await fetch(path, { cache: 'no-store' });
        const data = await response.json();
        if (!response.ok) {
            throw new Error(data.error);
        }
        return data;
    },
    post: async (path, data) => {
        const response = await fetch(path, {
            method: 'POST',
            headers: { 'Content-type': 'application/json' },
            body: JSON.stringify(data)
        });
        if (!response.ok) {
            const data = await response.json();
            throw new Error(data.error);
        }
        const contentType = response.headers.get('content-type');
        if (contentType && contentType.startsWith('application/json')) {
            return await response.json();
        }
        return null;
    },
    delete: async path => {
        const response = await fetch(path, { method: 'DELETE' });
        if (!response.ok) {
            const data = await response.json();
            throw new Error(data.error);
        }
    },
};

export default api;