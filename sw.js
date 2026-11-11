// Service worker: guarda o app e a Bíblia inteira no celular para funcionar sem internet.
// Ao publicar uma versão nova, aumente VERSAO para os celulares baixarem os arquivos novos.
const VERSAO = 'v9';
const CACHE = `biblia-ccb-${VERSAO}`;

const ARQUIVOS = [
  './',
  'index.html',
  'manifest.webmanifest',
  'css/app.css',
  'js/app.js',
  'js/util.js',
  'js/store.js',
  'js/tema.js',
  'js/dados.js',
  'js/sheet.js',
  'js/imagem.js',
  'js/arte.js',
  'js/voz.js',
  'img/notas.svg',
  'fonts/plus-jakarta-sans-latin-wght-normal.woff2',
  'js/views/inicio.js',
  'js/views/opcoes.js',
  'js/views/compartilhar.js',
  'js/views/livros.js',
  'js/views/leitura.js',
  'js/views/leitor.js',
  'js/views/busca.js',
  'js/views/salvos.js',
  'js/views/hinario.js',
  'js/views/sobre.js',
  'data/livros.json',
  'data/hinos.json',
  'data/resumos/livros.json',
  'icons/icon.svg',
  'icons/icon-192.png',
  'icons/icon-512.png',
  'icons/apple-touch-icon.png',
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    (async () => {
      const cache = await caches.open(CACHE);
      await cache.addAll(ARQUIVOS);
      // Baixa os 66 livros (≈4 MB) para a leitura e a busca funcionarem offline.
      const livros = await (await fetch('data/livros.json')).json();
      await cache.addAll(livros.map((l) => `data/biblia/${l.id}.json`));
      // Resumos dos capítulos que já foram escritos.
      const comResumo = await (await fetch('data/resumos/livros.json')).json();
      await cache.addAll(comResumo.map((id) => `data/resumos/${id}.json`));
      await self.skipWaiting();
    })(),
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    (async () => {
      const nomes = await caches.keys();
      await Promise.all(nomes.filter((n) => n.startsWith('biblia-ccb-') && n !== CACHE).map((n) => caches.delete(n)));
      await self.clients.claim();
    })(),
  );
});

// Estratégia: primeiro o que está guardado (rápido e offline); se não tiver, busca na internet e guarda.
self.addEventListener('fetch', (event) => {
  const req = event.request;
  if (req.method !== 'GET' || new URL(req.url).origin !== self.location.origin) return;
  event.respondWith(
    (async () => {
      const cache = await caches.open(CACHE);
      const salvo = await cache.match(req, { ignoreSearch: true });
      if (salvo) return salvo;
      try {
        const resp = await fetch(req);
        if (resp.ok) cache.put(req, resp.clone());
        return resp;
      } catch (e) {
        if (req.mode === 'navigate') return cache.match('index.html');
        throw e;
      }
    })(),
  );
});
