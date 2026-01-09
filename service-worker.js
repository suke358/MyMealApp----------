// キャッシュバージョン管理（更新時にこの値を変更すると自動でキャッシュが更新されます）
const CACHE_VERSION = 'meal-app-v3';
const CACHE_NAME = `meal-app-${CACHE_VERSION}`;
const urlsToCache = [
  './',
  './index.html',
  './css/style.css',
  './js/script.js',
  './manifest.json'
];

// ==========================================
// インストールイベント: 新しいキャッシュを作成
// ==========================================
self.addEventListener('install', event => {
  console.log(`[Service Worker] インストール開始: ${CACHE_NAME}`);
  
  // インストールを即座に完了させ、古いService Workerを置き換える
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log(`[Service Worker] キャッシュを作成: ${CACHE_NAME}`);
        return cache.addAll(urlsToCache);
      })
      .then(() => {
        console.log(`[Service Worker] キャッシュのインストール完了`);
        // 古いService Workerを即座に置き換える（skipWaiting）
        return self.skipWaiting();
      })
      .catch(error => {
        console.error(`[Service Worker] インストールエラー:`, error);
      })
  );
});

// ==========================================
// アクティベートイベント: 古いキャッシュを削除
// ==========================================
self.addEventListener('activate', event => {
  console.log(`[Service Worker] アクティベート開始`);
  
  event.waitUntil(
    caches.keys()
      .then(cacheNames => {
        // 現在のキャッシュ名以外のすべてのキャッシュを削除
        return Promise.all(
          cacheNames.map(cacheName => {
            if (cacheName !== CACHE_NAME) {
              console.log(`[Service Worker] 古いキャッシュを削除: ${cacheName}`);
              return caches.delete(cacheName);
            }
          })
        );
      })
      .then(() => {
        console.log(`[Service Worker] 古いキャッシュの削除完了`);
        // すべてのクライアントを制御下に置く
        return self.clients.claim();
      })
      .catch(error => {
        console.error(`[Service Worker] アクティベートエラー:`, error);
      })
  );
});

// ==========================================
// フェッチイベント: ネットワーク優先、フォールバックでキャッシュ
// ==========================================
self.addEventListener('fetch', event => {
  // GETリクエストのみキャッシュを処理
  if (event.request.method !== 'GET') {
    return;
  }
  
  event.respondWith(
    // まずネットワークから取得を試みる（常に最新版を取得）
    fetch(event.request)
      .then(response => {
        // レスポンスが有効な場合、キャッシュに保存
        if (response && response.status === 200) {
          const responseToCache = response.clone();
          caches.open(CACHE_NAME)
            .then(cache => {
              cache.put(event.request, responseToCache);
            });
        }
        return response;
      })
      .catch(() => {
        // ネットワークが失敗した場合、キャッシュから取得
        return caches.match(event.request)
          .then(cachedResponse => {
            if (cachedResponse) {
              console.log(`[Service Worker] キャッシュから取得: ${event.request.url}`);
              return cachedResponse;
            }
            // キャッシュにもない場合はエラーレスポンス
            return new Response('オフラインです', { status: 503 });
          });
      })
  );
});

// ==========================================
// メッセージイベント: クライアントからの更新チェック要求に対応
// ==========================================
self.addEventListener('message', event => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    console.log(`[Service Worker] SKIP_WAITINGメッセージを受信`);
    self.skipWaiting();
  }
  
  if (event.data && event.data.type === 'CHECK_UPDATE') {
    console.log(`[Service Worker] 更新チェック要求を受信`);
    // 更新チェックを実行
    self.registration.update()
      .then(() => {
        console.log(`[Service Worker] 更新チェック完了`);
      })
      .catch(error => {
        console.error(`[Service Worker] 更新チェックエラー:`, error);
      });
  }
});