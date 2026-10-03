// vtt-interceptor.js
(function() {
    const originalFetch = window.fetch;
    
    window.fetch = function(...args) {
        return originalFetch.apply(this, args).then(response => {
            if (args[0].endsWith('.vtt') && response.ok) {
                return response.clone().text().then(vttText => {
                    const fixedVtt = vttText.replace(
                        /X-TIMESTAMP-MAP=LOCAL:00:00:00\.000,MPEGTS:183600/,
                        'X-TIMESTAMP-MAP=LOCAL:00:00:00.000,MPEGTS:90000'
                    );
                    
                    return new Response(fixedVtt, {
                        status: response.status,
                        statusText: response.statusText,
                        headers: response.headers
                    });
                });
            }
            return response;
        });
    };
})();