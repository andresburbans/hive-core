---
name: swe-clean-code-reviewer
description: Automated code review skill based on Clean Code and SOLID principles.
---

# SWE Clean Code Reviewer Skill

Use to audit code for maintainability, readability, and architectural soundness.

## Instructions
1.  **SOLID Check:** Verify Single Responsibility, Open/Closed, etc.
2.  **Naming:** Flag non-descriptive variable/function names.
3.  **Function Length:** Recommend splitting functions longer than 20 lines.
4.  **Error Handling:** Ensure explicit error handling (no empty catch blocks).
5.  **DRY vs WET:** Balance code reuse with clarity.

## Examples
**User:** Review this function for me.
**Agent:** Function too long. Naming "data" vague. Split into three helpers. Use try-catch.
