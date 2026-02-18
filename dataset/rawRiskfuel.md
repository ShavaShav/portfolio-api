# Riskfuel work experience details

## Summary

- Responsible for design, implementation of various web applications, both customer and internal facing tools.
- Designed and implemented various features such as
  - Authentication and authorization across the full stack, utilizing Keycloak.
  - Frontend UI mockups
  - UX design of web UI, CLIs
  - System design across the full stack
  - Writing test cases and plans
  - Relational database design
  - Utilitizing kubernetes in deployments
  - Continuous integration and continuous deployment
  - Git branching strategy
  - Staging server implementation
  - Remote development environments and kubernetes clusters
- Managed JIRA for project management
  - Setup workflows
  - Managed scrum boards
  - Created and pruned backlogs regularely
- Responsible for mentoring and training junior developers across the wide variety of software skills utilized in the position.
- Managed the git and github
  - Set up a branching strategy for deploying 2 main branches: 1 to staging and 1 to production.
- Designed and implemented test case management in Jira XRay
  - All manual by default
  - Automated some of the higher priority tests to run in CI
- Worked across full stack of microservices
  - Managed backups of databases
  - Postgres (later CockroachDB) utilising Prisma as an ORM and migration tool, Redis, and others for database depending on the component’s uses
  - Various python REST Apis for interacting with the machine learning code written by data scientists
- Heavy use of Graphql, React, Next.JS, FastAPI, Material UI, Bull.JS, Prisma, Docker, Kubernetes, Chart.JS, Styled-Componenets (CSS-In-JS), Pulsar, Loki, Grafana, Prometheus, Helm, Argo workflows
- Testing
  - Regularly wrote unit tests with jest, pyunit, etc
  - Designed and documented test cases. Managed test plans and runs
  - Implemented end to end test automation
- Improved release process through branching strategy and staging server.
  - Development and release branches
- Wrote prometheus metrics and endpoints, as well as Grafana dashboard and alerts which utilized them. Also managed prometheus instances.
- Managed CI/CD processes
  - Running appropriate tests and builds on release branch and pull requests
  - Managed workflow runners
  - Docker image registries (Github Container Registry and Harbor)
- Kubernetes cluster administration
  - Managing own and other’s deployments, RBAC, etc
- Configured a local development environment for developing the system which heavily used kubernetes operators, utilising temporary kubernetes clusters in the cloud and Garden.io.
  - Implemented code quality tools such as linting and formatting through pre-commit hooks
- Wrote design documents utilising UML and software engineering best practises for large architecture improvements and new features
  - One being a large change to our data model and architecture, moving data and processing logic out of kubernetes custom resources and operators.
- Responsible for project management such as pruning JIRA backlogs, managing workflows, and setting up best practises
- Led and mentored team of relatively newer developers on full stack development
- Used various programming languages like Typescript, Javascript, Golang, Python, Rust, Bash
- Regular testing activities: writing unit tests, performing manual testing
- Mentored junior developers in kubernetes and full stack development

## Projects

### VAE demo

- Customer-facing demo.
- FastAPI REST API backend, interacting with the machine learning model
- React/Next.JS frontend
- Chart.JS volatility charts
- 3d interactive volatility surface on a grid, created with three.js
  - This was a total custom 3D interactive visualisation with animation
- Clients would select a scenario (which is an interesting day for options trading). Put and call stcok option data would be shown, along with the AI-estimated volatilities.
- Users could interact with the dataset through various UI components, typically with points on a chart, then run inference on it through Riskfuel’s models to calculate accurate volatilities.
- Charts efficiently handled millions of points updating in real time

### Lever

- A hackathan project
- Came up with an idea to tweak machine learning parameters while the model is training. Implemented a web app to do so in a couple days, utilizing React, python, wandb and flask
- The project was successful and we ended up deploying it in production and maintaining/improving it.


### Neural network visualisation demo
- Independent development
- Customer-facing demo.
- 3D interactive visualisation to show a AI neural network calculating a volatility
  - Inputs stock data is shown feeding into the neural network, and outputting a caldulated volatility.
  - Shows the neural network activations at each layer, changing in color and size as it receives inputs
  - User can zoom in, slow down, rotate neural network visualisation as it runs
- Built with Three.JS and React, with a Python backend for the neural network inference

### Stock realtime options risk analysis
- Showing results of realtime inference in graphs
- Connected to a proprietary database Kinetica

### Garage
- Custom internal tool used by riskfuel data scientists to aid in their machine learning tasks, such as data generation, data processing/transformations and training tasks.
- Responsible for design and implementation of the entire stack of microservices such as:
  - Frontend application
    - Built with React / Next.JS, and Material UI design.
    - Developed a meta framework for basic CRUD activity, which was used across the app.
    - Authentication with Keycloak
    - Role-based authorization with finer grade controls implemented at the application level
    - Effective use of react by designing reusable components and hooks through best practises
    - Error handling with react error boundaries and analysis via browser error log aggregation
    - Commenting and activity tracking feature across the stack for all resources. Common abstraction
  - GraphQL backend
    - Served as a gateway between the frontend, and the database and other microservices
    - Optimised with dataloaders for batched requests and carefully considered resolvers
    - Cursor-based pagination, sorting, filtering and search of lists
    - Interacted heavily with database and kubernetes API for deploying machine learning workloads
    - Asynchronous background tasks handled by Bull.js or other backends
  - Dataset manager
    - Handle automatic backup of older datasets to a slower storage medium (which was cheaper)
    - Managed moving datasets between a slower and faster medium - typically CEPH - to help save on costs for data which is not commonly used
 - Kubernetes operators
    - Configuring data processing pipelines on a cluster by using kubernetes primitives
    - Automatic scaling of data generation workloads depending on cluster availability and the dataset’s configured priority
- Used NX workspaces for managing node apps in a monorepo 
