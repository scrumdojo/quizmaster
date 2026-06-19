# Development Environment

To prepare your local development environment, follow these steps.

Run the app in a local environment at your own peril, as there will be no time during the class
to troubleshoot any potential deviation in your local settings.

## 📋 Prerequisites

You need to have the following software installed on your machine:

- [Java JDK 21](https://www.oracle.com/java/technologies/downloads/#java21)
- [Node.js 24](https://nodejs.org/en/download)
- [pnpm](https://pnpm.io/installation)
- [PostgreSQL 16](https://www.postgresql.org/download/)

On Arch Linux, the equivalent host packages are:

```sh
sudo pacman -Sy --needed jdk21-openjdk nodejs-lts-krypton pnpm postgresql chromium ripgrep
```

## 🔧 Setup

### PostgreSQL Database

After cloning the repository, create a database:

```sh
psql -U postgres -f backend/create_db.sql
```

On Arch Linux, initialize and start PostgreSQL first if this is a fresh install:

```sh
sudo runuser -u postgres -- initdb -D /var/lib/postgres/data
sudo systemctl enable --now postgresql
psql -U postgres -f backend/create_db.sql
```

Then use the host-local developer scripts:

```sh
pnpm dev:setup
pnpm dev:run
```

The development gate is:

```sh
pnpm dev:gate
```

Standalone E2E runs reset Quizmaster app data before starting so repeated local test runs do
not pile up workspaces, quizzes, questions, cohorts, or attempts. To do the same manually:

```sh
pnpm dev:reset-db
```
