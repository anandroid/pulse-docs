# Pulse: A Hyperlocal Information Platform

Pulse is a platform designed to deliver hyperlocal information with high availability and real-time accuracy. It addresses the challenge of aggregating, processing, and serving localized data streams efficiently, providing users with timely and relevant insights. Pulse is architected to support a growing ecosystem of services and applications that depend on precise, context-aware information.

## Architectural Philosophy

The Pulse platform is built upon a set of core architectural tenets to ensure robustness, scalability, and maintainability:

*   **Microservices Architecture:** Promoting modularity, independent scalability, and fault isolation. Each core component of Pulse is designed as a discrete service, allowing for targeted updates and resilient operations.
*   **Cloud-Native Design:** Leveraging Google Cloud Platform (GCP) for its elasticity, resilience, and comprehensive suite of managed services. This approach allows Pulse to dynamically adapt to load and benefit from Google's advanced infrastructure capabilities.
*   **API-Driven Ecosystem:** Ensuring robust interoperability and extensibility through well-defined RESTful interfaces. This facilitates seamless integration between Pulse services and third-party applications.
*   **Infrastructure as Code (IaC):** Emphasizing automated, repeatable, and version-controlled infrastructure provisioning via Terraform. This ensures consistency across environments and streamlines deployment processes.
*   **Data-Centric Approach:** Focusing on efficient data ingestion, processing, and retrieval using Firestore and optimized data structures. The platform is designed to handle diverse data types and query patterns effectively.

## Technical Overview

Pulse's architecture is rooted in a robust, cloud-native paradigm, utilizing GCP to achieve horizontal scalability and operational excellence. The system employs a microservices approach, where distinct components manage specific functionalities, communicating via well-defined APIs. This design enhances modularity, simplifies development workflows, and improves fault tolerance.

## Core Service Overview (`pulse` service)

The central `pulse` service, an Express-based application deployed on Cloud Run, serves as the primary orchestration layer. Its key responsibilities include:

*   **SERP Data Aggregation and Structuring:** Leveraging OpenAI's capabilities to fetch, parse, and structure data from Search Engine Results Pages (SERPs).
*   **Firestore Document Management:** Providing comprehensive CRUD (Create, Read, Update, Delete) operations for documents within Google Firestore, serving as the primary data persistence layer.
*   **Scheduled Task Execution:** Managing and executing periodic tasks, such as data cleanup and system maintenance, via Cloud Scheduler integration.

### Key API Endpoints

The Pulse service exposes a set of RESTful API endpoints designed for clarity and ease of integration:

*   `/serp` – Fetches and parses search results, enhanced by OpenAI.
*   `/firestore/:collection` – Manages document creation, updates, and queries within the specified Firestore collection.
*   `/openai/prompt-update` – Updates Firestore entries based on dynamic OpenAI-driven prompts.
*   `/pinecone/delete-all` – Provides an administrative endpoint to remove all vectors from Pinecone (if integrated).
*   `/cron/ping` – A sample endpoint for Cloud Scheduler verification and health checks.

## Component Ecosystem

The Pulse platform is composed of several key components, each with a dedicated role. Detailed documentation and source code for each are managed in their respective dedicated repositories.

### Core Components

#### `pulse`
The central service orchestrating core functionalities, data processing, and API provisions.
*   **Technical Stack:** Node.js, Express, Cloud Run, Cloud Scheduler.
*   **Key Features:** Cloud-native, containerized, scheduled job processing, primary system API integration.

#### `pulse-ui`
Manages the user interface, focusing on user interaction, data visualization, and responsive design.
*   **Technical Stack:** Leverages a modern frontend framework (e.g., React/Vue.js), TypeScript, CSS/SASS, state management (e.g., Redux/Vuex).
*   **Key Features:** Interactive user experience, real-time data presentation, responsive layouts, modular component library.

#### `pulse-apis`
Comprises backend API services that underpin the Pulse platform, managing business logic and data flow between the frontend and data stores.
*   **Technical Stack:** RESTful APIs, Node.js/Express, microservices architecture, database integration (e.g., Firestore, potentially others like MongoDB/PostgreSQL), robust authentication and authorization mechanisms.
*   **Key Features:** Secure and scalable API endpoints for data management, comprehensive data validation, seamless integration with other services.

### Supporting Libraries

#### `pulse-type-registry`
A shared library providing Zod schemas and TypeScript types, ensuring type consistency and data validation across the Pulse ecosystem.
*   **Technical Stack:** TypeScript, Zod schema validation, NPM package management.
*   **Key Features:** Centralized type definitions, robust schema validation, enhanced type safety, promotes cross-service data integrity.

### Infrastructure

#### `terraform-gcp`
Contains the Infrastructure as Code (IaC) configurations for deploying and managing Pulse on Google Cloud Platform.
*   **Technical Stack:** Terraform, Google Cloud Platform.
*   **Key Features:** Automated infrastructure provisioning, declarative cloud resource management, environment configuration, streamlined deployment automation.

## Development & Deployment Strategy

### Prerequisites
*   Node.js (Latest LTS version recommended)
*   Docker
*   Google Cloud SDK (gcloud CLI)
*   Terraform
*   Git

### Local Development

1.  **Clone Repositories:** Use the `setup.sh` script to clone all Pulse repositories. Provide your GitHub credentials via environment variables:
    ```bash
    export GITHUB_USERNAME=<your-username>
    export GITHUB_TOKEN=<your-token>
    ./setup.sh
    ```
    If authentication isn't required, you can run `setup_repos.sh` directly or clone repositories manually.

2.  **Install Dependencies:** Navigate into each cloned repository directory and install its specific dependencies.
    ```bash
    cd <repository-directory>
    npm install 
    ```

3.  **Environment Configuration:**
    *   Set up necessary local environment variables (e.g., API keys, database connection strings).
    *   Configure local instances of required services (e.g., local Firestore emulator).
    *   Authenticate the Google Cloud SDK for local development access if needed.

4.  **Run Development Servers:** Each component repository contains detailed instructions for its specific build and run processes. Consult the `README.md` within each component's directory for guidance on starting development servers, port configurations, and local endpoints.

### Deployment

Deployment to Google Cloud Platform is managed via a declarative IaC approach using Terraform, ensuring environment consistency and automated provisioning of resources.

1.  **Infrastructure Provisioning:**
    *   Navigate to the `terraform-gcp` repository.
    *   Initialize Terraform: `terraform init`
    *   Review the execution plan: `terraform plan`
    *   Apply the configuration: `terraform apply`

2.  **Application Deployment:**
    *   Deployment processes for individual services (e.g., `pulse`, `pulse-ui`) are detailed within their respective repositories. These typically involve building container images and deploying to Cloud Run or other relevant GCP services.
    *   Always verify deployment status and service health post-deployment.

## Contribution Guidelines

Contributions to the Pulse platform are highly encouraged. To ensure consistency and quality:

*   Adhere to the coding standards and style guides defined within each component repository.
*   Write comprehensive unit and integration tests for all new features and bug fixes.
*   Follow the established branching and pull request process (e.g., fork, feature branch, commit, push, pull request).
*   Consult individual repository `CONTRIBUTING.md` files for more specific guidelines.

## License

Each repository within the Pulse ecosystem may have its own licensing terms. Please refer to the `LICENSE` file in the respective repositories for detailed information.

## Support

For issues, questions, or support requests:
*   Utilize the issue tracker within the specific GitHub repository for the relevant component.
*   Consult the documentation provided within each repository.
*   For broader architectural questions or cross-component concerns, reach out to the core engineering team or designated maintainers.
