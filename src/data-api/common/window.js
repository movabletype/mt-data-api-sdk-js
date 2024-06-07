if (typeof window === 'undefined') {
    window = {
        fetch: globalThis.fetch,
        FormData: globalThis.FormData,
        File: require('stream').Stream
    };
}
