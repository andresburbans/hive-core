---
name: pwa-manifest-optimization
description: Best practices for web app manifest files to ensure high quality PWA installation.
---

# PWA Manifest Optimization Skill

Use when creating or auditing `manifest.json`.

## Instructions
1.  **Icon Sizes:** Require 192x192 and 512x512 icons.
2.  **Maskable Icons:** Ensure at least one maskable icon for Android.
3.  **Display Modes:** Recommend `standalone` or `fullscreen`.
4.  **Theme/Background Colors:** Match manifest colors with app CSS/Meta tags.
5.  **Screenshots:** Include screenshots for the app store-like installation experience.

## Examples
**User:** Manifest not valid according to Lighthouse.
**Agent:** Add `purpose: "maskable"` to icon. Check short_name length. Verify start_url existence.
