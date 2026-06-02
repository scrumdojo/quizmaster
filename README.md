# Quizmaster

A training application for building stronger software teams.

## Getting started

### Create your development environment

There are three options how to create Quizmaster dev environment: In GitHub Codespaces cloud,
in a local container (Docker/Podman), or install everything old school locally:

| Dev Environment                                 |                                      |
|-------------------------------------------------|--------------------------------------|
| [GitHub Codespaces](docs/devenv/codespaces.md)  | ⭐ recommended, works out-of-box     |
| [Local Docker/Podman](docs/devenv/container.md) | requires [Docker Desktop](https://www.docker.com/products/docker-desktop/) or [Podman Desktop](https://podman-desktop.io/)  |
| [Local Environment](docs/devenv/local.md)       | not recommended, you're on your own  |

See more for [comparison](docs/devenv/comparison.md).

The dev environment is based on [scrumdojo/dev-images](https://github.com/scrumdojo/dev-images),
which are based on [Docker Hardened Image](https://www.docker.com/products/hardened-images/):
[Debian Trixie](https://hub.docker.com/hardened-images/catalog/dhi/debian-base).

### Quick start
In the project root directory, install the dependencies:

```bash
pnpm install:all
```

Start Quizmaster on port `8080` (and also Vite dev server on port `5173`):

```bash
pnpm start
```

### Setup your IDE
If you opened a GitHub Codespace in VS Code, there is nothing to setup, everything is taken care of.
Otherwise, make sure to install recommended extensions to streamline your dev experience:

- Setup [VS Code](docs/devenv/vscode.md)
- Setup [IntelliJ IDEA](docs/devenv/intellij.md)

### [How to develop Quizmaster](docs/devenv/how-to-develop.md)

## Tech Stack

Prior to the class get yourself familiar with the tech stack:

- [Spring Boot](https://spring.io/projects/spring-boot)
- [Gradle](https://gradle.org/)
- [PostgreSQL](https://www.postgresql.org/)
- [Flyway](https://flywaydb.org/)
- [React](https://react.dev/)
- [Vite](https://vitejs.dev/)
- [Cucumber.js](https://cucumber.io/docs/guides/)
- [Playwright](https://playwright.dev/)
