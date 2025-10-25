// ArtBooms PWA - service worker minimale
self.addEventListener("install", event => self.skipWaiting());
self.addEventListener("activate", event => self.clients.claim());
// Non intercetta fetch -> nessun rischio per crawler o utenti
