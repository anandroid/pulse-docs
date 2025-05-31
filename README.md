# Pulse Engineering Guide

Pulse delivers hyperlocal information through a collection of microservices running on Google Cloud. This document focuses on the system's architecture and how the various repositories fit together.

## Automation Blueprint

Automation is stored in the `n8n-sync` repository. The workflow `pulse_background_processing.json` orchestrates background tasks like data enrichment and cleanup. n8n triggers these flows on a schedule and calls into the `pulse` and `pulse-apis` services to update Firestore and other stores.

## Repository Overview

- **pulse** – Node.js service exposing REST endpoints for SERP processing, document management and scheduled maintenance.
- **pulse-apis** – Collection of backend APIs providing business logic and external integrations.
- **pulse-ui** – Mobile-first web application for displaying real-time data.
- **pulse-type-registry** – Shared TypeScript types and Zod schemas used across the platform.
- **terraform-gcp** – Terraform configuration for all Google Cloud infrastructure.
- **n8n-sync** – Version-controlled n8n workflows, including `pulse_background_processing.json`.

## Operational Model

Services are containerized and deployed on Cloud Run. Firestore is the primary datastore, while Cloud Scheduler triggers maintenance endpoints. n8n flows call the APIs defined in `pulse` and `pulse-apis` to keep data fresh. Terraform provisions and manages all infrastructure so environments remain reproducible.

## Contributing

Follow the coding standards of each repository and keep tests and OpenAPI specifications in sync with implemented APIs. Issues and feature requests should be opened in the appropriate repository.

## Setup

Clone all repositories with the provided script:

```bash
./setup.sh
```

Consult the README inside each cloned repository for project-specific instructions.
