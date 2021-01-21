const VERSION_NUMBER = "0.1.1";

self.addEventListener("install", event => {

    self.skipWaiting();

    event.waitUntil(
        caches.open(VERSION_NUMBER).then(cache => {
            return cache.addAll([
                "/error.php?error=-1",
                "/css/basicStylesheet.css",
                "/css/stylesheet.css"
            ]);
        })
    );

});

self.addEventListener("activate", event => {

    event.waitUntil(
        caches.keys().then(keys => {
            return Promise.all(keys.map(key => {

                if(key !== VERSION_NUMBER) {

                    return caches.delete(key);

                }

            }));

        })
    );

    event.waitUntil(clients.claim());

});

self.addEventListener("fetch", event => {
    
    let url = event.request.url;

    if(url.endsWith("app") || url.endsWith("app.php")) {

        event.respondWith(
            fetch(event.request).catch(() => {
                return caches.match("/error.php?error=-1");
            })
        );

    }

    if(url.lastIndexOf("/js/") > 0 || url.lastIndexOf("/css/") > 0 || url.lastIndexOf("/img/") > 0 || url.lastIndexOf("/modules/") > 0 || url.lastIndexOf("/manifest.json") > 0) {

        event.respondWith(
            caches.match(event.request).then(cachedResponse => {
                if(cachedResponse) return cachedResponse;

                return fetch(event.request).then(response => {

                    if(response.status >= 200 && response.status < 400) {

                        return caches.open(VERSION_NUMBER).then(cache => {
                            cache.put(event.request, response.clone());
                            return response;

                        });

                    }

                    return response;

                })

            })
        );

    }

});