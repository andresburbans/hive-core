---
name: swe-performance-optimizer
description: Optimization techniques for web apps, including bundle size and rendering.
---

# SWE Performance Optimizer Skill

Use to speed up applications and improve user experience.

## Instructions
1.  **Code Splitting:** Use dynamic imports (`next/dynamic` or `React.lazy`).
2.  **Asset Optimization:** Compress images (WebP/AVIF), minify CSS/JS.
3.  **Bundle Analysis:** Recommend using `webpack-bundle-analyzer` or similar.
4.  **Runtime Perf:** Avoid unnecessary re-renders (useMemo, useCallback).
5.  **Critical Path:** Prioritize loading critical CSS and above-the-fold content.

## Examples
**User:** My Next.js page is slow.
**Agent:** Analyze Lighthouse report. Optimize images. Move logic to Server Components. Reduce bundle size.
