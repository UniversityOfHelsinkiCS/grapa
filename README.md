# Grapa

Application for monitoring masters thesis progresses and teacher workloads.

## Running locally

Clone the repo, and install docker to get started!

Before starting the project for the first time run `npm i` to install development dependencies.

### Getting the prod db locally

You can fetch the prod db locally using the [script](./scripts/get_prod_db.sh).

### Starting application

Start all the services in development mode:

```bash
$ npm start
# or
$ docker compose up
```

### Running updater locally

In order to run the updater locally you must enable the following [setupCron](./src/server/index.ts#60) for example by changing the `if` statement so that it is _true_.

### Running static code analysis

We use eslint and Prettier as the static analysis tools. To run these you can use these commands:

```bash
$ npm run lint # Run eslint
$ npm run format # Run Prettier
```

### Running tests locally

To run tests, you can use these commands:

```bash
$ npm run test:front # Run frontend unit tests
$ npm run test:integration # Run backend API integration tests
$ npm test # Run backend unit tests
```

To run tests in watch mode, you can use these commands:

```bash
$ npm run test:front:watch # Run frontend unit tests in watch mode
$ npm run test:integration:watch # Run backend API integration tests in watch mode
```

It's possible to interact with Jest while tests are running in a watch mode. For example, you can press `p` key while tests are running (just make sure to press it when Jest is already running, not the DB setup) to specify a single file or a regex to run only certain test files.

It's also possible to specify the file pattern to run the tests, e.g. `npm run test:integration:watch program` or `npm run test:front supervisor`

## Environment configuration

Create a `.env` file inside the project's root directory. In that file, copy the contents of the `.env.template` file and add the correct values for the variables based on the documentation.
