// Firebase Messaging Service Worker for background notifications
// This file must be in the public directory and served from root

importScripts(
  "https://www.gstatic.com/firebasejs/10.7.1/firebase-app-compat.js"
);
importScripts(
  "https://www.gstatic.com/firebasejs/10.7.1/firebase-messaging-compat.js"
);

// Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyCCjArmukZj9kEgsR7jxj6nfUSiQTWw1LU",
  authDomain: "management-proyek-897dc.firebaseapp.com",
  projectId: "management-proyek-897dc",
  storageBucket: "management-proyek-897dc.firebasestorage.app",
  messagingSenderId: "761099492855",
  appId: "1:761099492855:web:8f2782de4e19b1ce3422f2",
  databaseURL:
    "https://management-proyek-897dc-default-rtdb.asia-southeast1.firebasedatabase.app",
};

// Initialize Firebase
firebase.initializeApp(firebaseConfig);

// Initialize Firebase Messaging
const messaging = firebase.messaging();

// Handle background messages
messaging.onBackgroundMessage((payload) => {
  console.log(
    "[firebase-messaging-sw.js] Received background message ",
    payload
  );

  // Customize notification
  const notificationTitle = payload.notification?.title || "New Notification";
  const notificationOptions = {
    body: payload.notification?.body || "You have a new notification",
    icon: payload.notification?.icon || "/icon-192x192.png",
    badge: "/icon-72x72.png",
    tag: payload.data?.notificationId || "notification",
    data: payload.data,
    requireInteraction: false,
    // Add action buttons
    actions: [
      {
        action: "view",
        title: "View",
      },
      {
        action: "close",
        title: "Close",
      },
    ],
  };

  return self.registration.showNotification(
    notificationTitle,
    notificationOptions
  );
});

// Handle notification click
self.addEventListener("notificationclick", (event) => {
  console.log("[firebase-messaging-sw.js] Notification click received.", event);

  event.notification.close();

  // Handle action buttons
  if (event.action === "close") {
    return;
  }

  // Open the app or navigate to specific page
  const urlToOpen = event.notification.data?.link || "/notifications";

  event.waitUntil(
    clients
      .matchAll({ type: "window", includeUncontrolled: true })
      .then((clientList) => {
        // Check if there's already a window open
        for (const client of clientList) {
          if (client.url.includes(self.location.origin) && "focus" in client) {
            // Navigate to the notification link
            client.postMessage({
              type: "NOTIFICATION_CLICKED",
              data: event.notification.data,
            });
            return client.focus();
          }
        }
        // If no window is open, open a new one
        if (clients.openWindow) {
          return clients.openWindow(urlToOpen);
        }
      })
  );
});
