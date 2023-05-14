var CACHE_NAME = 'cache-name';

var urlsToCache = [
    '/',
    '/index.html',
    '/style.css',
    '/kaomoji.json',
    '/icon.svg',
];

self.addEventListener('install', function (event) {
    // 安装 Service Worker 时，将需要缓存的文件添加到缓存中
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then(function (cache) {
                return cache.addAll(urlsToCache);
            })
    );
});

self.addEventListener('activate', function (event) {
    // 删除旧的缓存数据
    event.waitUntil(
        caches.keys().then(function (cacheNames) {
            return Promise.all(
                cacheNames.map(function (cacheName) {
                    if (cacheName !== CACHE_NAME) {
                        return caches.delete(cacheName);
                    }
                })
            );
        })
    );
});

self.addEventListener('fetch', function (event) {
    event.respondWith(
        fetch(event.request)
            .then(function (response) {
                const clonedResponse = response.clone();
                // 如果响应有效，则将其添加到缓存中
                if (clonedResponse.ok) {
                    caches.open(CACHE_NAME)
                        .then(function (cache) {
                            cache.put(event.request, clonedResponse);
                        });
                }

                return clonedResponse;
            })
            .catch(function (error) {// 如果网络请求失败，则从缓存中获取响应
                return caches.match(event.request).then(function (cachedResponse) {
                    // 显示网络状态
                    self.clients.matchAll().then(function (clients) {
                        clients.forEach(function (client) {
                            client.postMessage({
                                type: 'updateNetworkStatus',
                                message: '网络请求失败，使用本地缓存'
                            });
                        });
                    });

                    return cachedResponse;
                });
            })
    );
});