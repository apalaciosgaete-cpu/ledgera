self.addEventListener("push", (event) => {
  const data = event.data?.json() ?? {};
  const title = data.title ?? "LEDGERA";
  const body = data.body ?? "Nuevo mensaje";
  event.waitUntil(
    self.registration.showNotification(title, {
      body,
      icon: "/brand/ledgera-app-icon.svg",
      badge: "/brand/ledgera-app-icon.svg",
      data: { url: "/admin/chat" },
    })
  );
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  event.waitUntil(
    clients.matchAll({ type: "window", includeUncontrolled: true }).then((list) => {
      for (const client of list) {
        if (client.url.includes("/admin/chat") && "focus" in client) return client.focus();
      }
      if (clients.openWindow) return clients.openWindow("/admin/chat");
    })
  );
});
