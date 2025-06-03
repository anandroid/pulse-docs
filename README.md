# Pulse Engineering Blueprint

Pulse is a collection of microservices that deliver hyperlocal information. All services run on Google Cloud and are orchestrated with Terraform and n8n. This document acts as a high-level blueprint for developers joining the project.

## Architecture Overview

```
    +---------+       +----------------+       +------------+
    |  pulse  | <---> |  pulse-apis    | <---> |  Firestore |
    +---------+       +----------------+       +------------+
          ^                 ^                      ^
          |                 |                      |
          |            +---------+           +-------------+
          |            |  n8n    |           | Cloud Run   |
          |            +---------+           +-------------+
```

* **pulse** handles SERP processing, document ingest and scheduled maintenance.
* **pulse-apis** exposes business APIs and third‑party integrations.
* **pulse-ui** is a mobile‑first web application displaying real‑time data to users.
* **pulse-type-registry** defines shared TypeScript types and Zod schemas.
* **terraform-gcp** provisions all Google Cloud resources.
* **n8n-sync** stores version‑controlled n8n workflows.

## Repository Map

The project spans several repositories that work together:

| Repository | Description |
|------------|-------------|
| `pulse` | Node.js service providing REST endpoints for ingesting SERP results, managing documents and running scheduled jobs. |
| `pulse-apis` | Backend service containing business logic, database access and third-party integrations. |
| `pulse-ui` | Web client built with a mobile-first approach. Consumes APIs from `pulse` and `pulse-apis`. |
| `pulse-type-registry` | Shared library of TypeScript types and validation schemas. Keeps the entire stack in sync. |
| `terraform-gcp` | Terraform configuration that defines Cloud Run services, Firestore indexes, Cloud Scheduler jobs and other infrastructure. |
| `n8n-sync` | Collection of n8n workflows. The `pulse_background_processing.json` flow orchestrates enrichment and cleanup jobs by calling service endpoints. |

## Automation

Automation lives in the `n8n-sync` repository. Workflows trigger on schedules and call `pulse` and `pulse-apis` to refresh data stores. Keeping the workflows in version control ensures that automation changes are peer reviewed alongside code changes.

## Local Development Setup

1. Export GitHub credentials for cloning private repositories:
   ```bash
   export GITHUB_USERNAME=<your-username>
   export GITHUB_TOKEN=<personal-access-token>
   ```
2. Clone all repositories using the helper script:
   ```bash
   ./setup.sh ~/pulse
   ```
3. Follow the README in each cloned repository to install dependencies and start local servers. Node.js projects typically use `npm install` and `npm run dev`.
4. Authenticate with Google Cloud if you need to run services against cloud resources:
   ```bash
   gcloud auth application-default login
   ```

## Infrastructure and Deployment

Infrastructure is defined in the `terraform-gcp` repository. Typical deployment flow:

1. Build container images with Docker or Cloud Build.
2. Push images to Google Container Registry.
3. Apply Terraform to create or update Cloud Run services, Firestore databases and scheduled jobs.
4. n8n flows automatically invoke service endpoints to perform background processing once infrastructure is live.

## Data Flow

1. Clients send data to the `pulse` service.
2. `pulse` forwards requests to `pulse-apis` for business logic and persistence.
3. Firestore stores core documents and search results.
4. n8n workflows periodically trigger cleanup or enrichment operations by hitting service endpoints.
5. `pulse-ui` fetches data from `pulse-apis` and renders dashboards for end users.

## Contributing

* Use feature branches and open pull requests for review.
* Keep unit tests and OpenAPI specifications in sync with code.
* Run `shellcheck` on shell scripts and existing test suites in each repository before submitting changes.

## Quick Reference

To clone repositories without prompts:
```bash
GITHUB_USERNAME=me GITHUB_TOKEN=secret ./setup.sh ~/pulse
```
All repositories will be created under `~/pulse`.

Consult the READMEs inside each repository for service-specific commands and environment variables.
