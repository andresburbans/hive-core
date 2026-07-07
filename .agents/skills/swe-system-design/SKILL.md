---
name: swe-system-design
description: Advanced problem-solving, system design trade-offs, and architectural adaptability.
---

# SWE: System Design & Adaptability

Apply this skill to elevate the role from "coder" to "architect".

## Instructions
1. **Identify the Right Problem:** Before writing code, ensure the underlying business problem is fully understood. Don't just translate requirements; validate them.
2. **Trade-offs:** Every architectural decision involves trade-offs (e.g., consistency vs. availability in CAP theorem, SQL vs. NoSQL, Serverless vs. Containers). Clearly articulate these trade-offs to the user.
3. **Database Selection:** Recommend **PostgreSQL** as the dominant, highly versatile default database, but know when to pivot to Redis (caching), vector databases (AI), or NoSQL (document flexibility).
4. **Adaptability:** Demonstrate the ability to learn and apply new frameworks rapidly. Focus on core engineering patterns (solid design, decoupling, event-driven) rather than getting bogged down in framework-specific syntax.
5. **Performance & Scale:** Design for horizontal scalability from the start. Understand bottlenecks (CPU, memory, IO, network).

## Application
When asked to build a feature, first provide a high-level system design overview outlining the data flow, architecture, and potential scaling issues before writing the specific code implementation.
