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

## 🔧 Setup

### PostgreSQL Database

After cloning the repository, create a database:

```sh
psql -U postgres -f backend/create_db.sql
```
