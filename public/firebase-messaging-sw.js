/* global self */

// Firebase Cloud Messaging checks this default path when notification support is present.
// The app does not currently handle background notifications, so this worker is intentionally minimal.
self.addEventListener('install', () => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim());
});
