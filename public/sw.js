// LEDGERA service worker retired.
// Kept intentionally as a no-op file so older browser registrations stop receiving chat-specific handlers.
self.addEventListener("install", () => self.skipWaiting());
self.addEventListener("activate", (event) => {
  event.waitUntil(self.registration.unregister());
});
