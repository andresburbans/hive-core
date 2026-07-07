---
name: swe-resilient-api-design
description: Designing APIs and client integrations that withstand network instability and server errors.
---

# SWE Resilient API Design Skill

Use when building robust client-server communications.

## Instructions
1.  **Exponential Backoff:** Implement retry logic with increasing delays.
2.  **Circuit Breaker:** Stop calling failing services to allow recovery.
3.  **Idempotency:** Ensure retried requests don't cause duplicate side effects.
4.  **Optimistic UI:** Update UI immediately, then sync with the server.
5.  **Timeouts:** Always define reasonable request timeouts.

## Examples
**User:** How do I handle 500 errors from my backend?
**Agent:** Implement retry with backoff. Log error. Show fallback UI. Use SWR/React Query.
