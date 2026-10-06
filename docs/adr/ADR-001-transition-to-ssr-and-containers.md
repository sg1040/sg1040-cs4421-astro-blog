# ADR-001: Transition from Static Site to Containerized SSR Runtime
## Status: Superseded
This decision was superseded on 2026-10-06 by a return to static S3/CloudFront
hosting to avoid the ongoing cost of a server runtime.
## Context
Our platform requires dynamic API endpoints (/api/health, /api/feedback).
Static hosting on S3 cannot execute server-side Node.js code.
## Previous Decision
The site was configured with the `@astrojs/node` adapter in standalone mode
and packaged as a Docker container.
## Consequences
- Positive: Enabled live API routes, dynamic rendering, and operational health checks.
- Negative: Increased operational complexity and required paid container compute.

## Current Deployment
The site is now built as static output and deployed to S3 behind CloudFront.
Server-side API routes and runtime health checks are not available in this
deployment.