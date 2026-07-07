---
name: pwa-push-notifications
description: Implementing Web Push API and VAPID keys in PWA applications.
---

# PWA Push Notifications Skill

Use when adding push notifications to a PWA.

## Instructions
1.  **Subscription Flow:** Handle permission request, VAPID key exchange, and server-side storage.
2.  **Service Worker Logic:** Implement `push` and `notificationclick` events.
3.  **Payload Handling:** Secure notification payloads and handle background click actions.
4.  **Browser Compatibility:** Warn about iOS/Safari specific push requirements.

## Examples
**User:** How do I send a push to a specific user?
**Agent:** Get subscription object. Store in DB. Use `web-push` library on backend. Send notification payload.
