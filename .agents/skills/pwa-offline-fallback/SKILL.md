---
name: pwa-offline-fallback
description: Handling offline scenarios with graceful fallbacks and custom offline pages.
---

# PWA Offline Fallback Skill

Use when ensuring the app remains usable even without a network connection.

## Instructions
1.  **Offline Page:** Always cache a static `/offline` page during SW installation.
2.  **Network-First with Fallback:** Implement fetch strategy that returns the offline page on network failure.
3.  **Visual Indicators:** Add "You are offline" banners/modals to the UI.
4.  **Data Mocking:** Provide stale cached data if the fresh API call fails.

## Examples
**User:** What happens if the user opens the app in a tunnel?
**Agent:** Service worker detects failure. Serves cached `/offline` page. Displays toast message.
