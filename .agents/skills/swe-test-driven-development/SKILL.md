---
name: swe-test-driven-development
description: Guide for Red-Green-Refactor workflow and testing strategies.
---

# SWE Test Driven Development Skill

Use when the user wants to implement robust testing or follow TDD.

## Instructions
1.  **Red Phase:** Write the failing test first. Define requirements.
2.  **Green Phase:** Write minimal code to pass the test.
3.  **Refactor Phase:** Clean up code while keeping tests green.
4.  **Pyramid Strategy:** prioritize Unit > Integration > E2E tests.
5.  **Tools:** Use Vitest, Jest, or Playwright as appropriate.

## Examples
**User:** I want to add a feature to calculate tax.
**Agent:** Write test case for tax logic. Run test (fails). Implement logic. Run test (passes). Refactor for performance.
