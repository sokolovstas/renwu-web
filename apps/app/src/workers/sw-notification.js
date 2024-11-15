self.addEventListener('push', function (event) {
  if (!(self.Notification && self.Notification.permission === 'granted')) {
    return;
  }
  // { badge: number; title: string; body: string }
  const data = event.data?.json() ?? {};

  const title = data.title || 'Message';
  const body = data.body || '';
  const icon = 'assets/icons/icon-transparent.png';

  if (data.badge > -1) {
    self.navigator.setAppBadge(data.badge);
  }

  event.waitUntil(
    self.registration.showNotification(title, {
      body: body,
      icon,
    }),
  );
});

self.addEventListener('notificationclick', async function (event) {
  event.notification.close();

  event.waitUntil(
    clients
      .matchAll({
        type: 'window',
      })
      .then((clientList) => {
        for (const client of clientList) {
          if ('focus' in client) return client.focus();
        }
      }),
  );
});

self.addEventListener('message', function (evt) {
  // { command: 'badge', value: messageCount }
  if (evt.data.command === 'badge') {
    self.navigator.setAppBadge(evt.data.value);
  }
});
