---
name: pwa-offline-storage
description: Expert guidance on managing offline data using IndexedDB and Cache API.
---

# PWA Offline Storage Skill

Use when developing offline capabilities for web applications.

## Instructions
1.  **IndexedDB First:** Recommend `idb` or `Dexie.js` for structured data.
2.  **Cache API:** Use for static assets and API responses.
3.  **Versioning:** Always implement cache versioning and stale-while-revalidate patterns.
4.  **Storage Limits:** Advise on checking storage quotas (`navigator.storage`).

## Examples
**User:** How do I save user settings offline?
**Agent:** Use IndexedDB. Install `idb`. Create store. Put settings object. Retrieve on load.
