
FT Express Web Service [![CircleCI](https://circleci.com/gh/Financial-Times/express-web-service.svg?style=svg)](https://circleci.com/gh/Financial-Times/express-web-service)
======================

Create [Express] middleware to serve `/__gtg`, `/__health`, `/__about`, and `/__error` endpoints.

  - [Usage](#usage)
    - [Requirements](#requirements)
    - [API Documentation](#api-documentation)
    - [Options](#options)
    - [Examples](#examples)
  - [Migration](#migration)
  - [Contributing](#contributing)
  - [Contact](#contact)
  - [Licence](#licence)


Usage
-----

### Requirements

Running Express Web Service requires [Node.js] 6.x and [npm]. You can install with:

```sh
npm install @financial-times/express-web-service
```

You'll also need to be using [Express] 4+. Express Web Service also supports [Restify] with a few modifications, see [the examples](#examples) for more information.

### API Documentation

Familiarity with [Express] is assumed in the rest of the API documentation. You'll also need to require the module with:

```js
const expressWebService = require('@financial-times/express-web-service');
```

### `expressWebService( [options] )`

Create and return a middleware for serving FT webservice endpoints, customisable with an [options object](#options).

```js
const app = express();

app.use(expressWebService({
    // options
}));

// or mount on a sub-path
app.use('/example', expressWebService({
    // options
}));
```

The following routes are added:

#### Good to go (`/__gtg`)

Conforms to the [FT Good to go standard], emitting a `200 OK` response if the application should be considered healthy, and `503 Service Unavailable` if it should not. This is intended to be used to make routing decisions.

Always returns `200 OK` unless a `goodToGoTest` option is specified.

#### Health check (`/__health`)

Conforms to the [FT Healthcheck standard], returning JSON data summarising the current health status of the application.

Always returns an `[{ ok:true }]` healthcheck response (ie a valid healthcheck response with a single ok check) unless the `healthCheck` option is specified.

#### About (`/__about`)

Conforms to the (at time of writing, draft) [FT About endpoint standard], returning JSON data describing the application, and providing links to all relevant dashboards and support documentation resources.

The information emitted by the about endpoint is populated from the `about` option.  The `_hostname` and `appVersion` fields will be populated automatically if not present in the data passed in through the `about` option.

#### Error (`/__error`)

This endpoint simply throws a JavaScript error, and makes no attempt to handle it. This is useful for testing the way that your application handles runtime errors in prod, both in terms of reporting them (eg to a logging or aggregation tool) and presenting an appropriate UI to the end user.

### Options

The available options are as follows:

  - `manifestPath`: (Optional) Path to the app's `package.json` file. This will be used to populate the `appVersion` and `dateDeployed` properties of the `/__about` endpoint, if they are not specified explicitly
  - `about`: (Optional) Object containing standard runbook properties as defined in the [ft about endpoint standard], or a Promise that resolves to an object containing these properties
  - `goodToGoTest`: (Optional) A function that can be used to indicate the good to go status of the service, the function should return a Promise resolved with `true` to indicate a positive good to go status, and `false` to indicate a negative good to go status
  - `healthCheck`: (Optional) A function that can be used to generate structured healthcheck information, the function should return a Promise resolved with an array of healthcheck objects
  - `routes`: (Optional) An array of routes to install.  Possible values are `health`, `gtg`, `about` and `error`.  Defaults to `["health", "gtg", "about"]`

### Examples

Basic example:

```JS
const express = require('express');
const expressWebService = require('@financial-times/express-web-service');

const app = express();

app.use(expressWebService({
	manifestPath: `${__dirname}/package.json`,
	about: {
		"schemaVersion": 1,
		"name": "build-service",
		"purpose": "Front end build process as a service.  Fetches specified Origami components from git, runs Origami build process, and returns the resulting CSS or JS bundle over HTTP.",
		"audience": "public",
		"primaryUrl": "https://origami-build.ft.com",
		"serviceTier": "gold"
	}
}));
```

Example with Good To Go logic and Healthcheck logic:

```JS
app.use(expressWebService({
	manifestPath: `${__dirname}/package.json`,
	about: {
		"schemaVersion": 1,
		"name": "build-service",
		"purpose": "Front end build process as a service.  Fetches specified Origami components from git, runs Origami build process, and returns the resulting CSS or JS bundle over HTTP.",
		"audience": "public",
		"primaryUrl": "https://origami-build.ft.com",
		"serviceTier": "gold"
	},
	goodToGoTest: function() {
		return new Promise(function(resolve, reject) {
			resolve(isApplicationHappy());
		});
	},
	healthCheck: function() {
		// You might have several async checks that you need to perform or
		// collect the results from, this is a really simplistic example
		return new Promise(function(resolve, reject) {
			resolve([
				{
					name: "Database TCP connectivity",
					ok: false,
					severity: 2,
					businessImpact: "Article pages will not be available",
					technicalSummary: "The database is dead",
					panicGuide: "Check the health status of the database at host <database host>",
					checkOutput: "tcp connect failed after 10 seconds on destination port 3306 - destination unreachable",
					lastUpdated: new Date().toISOString()
				}
			]);
		});
	}
}));
```

Example of using with [Restify] rather than Express:

```js
const expressWebService = require('@financial-times/express-web-service');
const restify = require('restify');

const server = restify.createServer();

// Because Restify doesn't mount middleware for routes that don't exist,
// we have to explicitly define the required routes
server.get(/^\/__(about|gtg|health)$/, expressWebService({
	// config
}));
```


Migration
---------

This migration guide aims to help you migrate between major versions of Express Web Service.

### Migrating from v2.x.x to v3.x.x

There are some big changes between versions 2 and 3 of this library. Firstly the module has been renamed from `express-ftwebservice` to `@financial-times/express-web-service`.

The entire API has been updated to use Express middleware:

```js
const express = require('express');
const expressWebService = require('@financial-times/express-web-service');
const app = express();
const options = {};

// Old
expressWebService(app, options);

// New
app.use(expressWebService(options));
```

Also the `about` option now accepts either an object (matching version 2), or a promise which resolves to an object. This allows you to generate your about information asynchronously:

```js
app.use(expressWebService({
    about: {
        name: 'My App'
    }
}));
// or
app.use(expressWebService({
    about: new Promise((resolve, reject) => {
        // do something async
        resolve(retrievedAboutInfo);
    })
}));
```


Contributing
------------

This module has a full suite of unit tests, and is verified with ESLint. You can use the following commands to check your code before opening a pull request.

```sh
make verify  # verify JavaScript code with ESLint
make test    # run the unit tests and check coverage
```


Contact
-------

If you have any questions or comments about this module, or need help using it, please either [raise an issue][issues], visit [#origami-support] or email [Origami Support].


Licence
-------

This software is published by the Financial Times under the [MIT licence][license].



[#origami-support]: https://financialtimes.slack.com/messages/origami-support/
[express]: http://expressjs.com/
[ft about endpoint standard]: https://docs.google.com/document/d/1B80a0nAI8L1cuIlSEai4Zuztq7Lef0ytxJYNFCjG7Ko/edit
[ft good to go standard]: https://docs.google.com/document/d/11paOrAIl9eIOqUEERc9XMaaL3zouJDdkmb-gExYFnw0/edit
[ft healthcheck standard]: https://docs.google.com/document/d/18hefJjImF5IFp9WvPAm9Iq5_GmWzI9ahlKSzShpQl1s/edit
[issues]: https://github.com/Financial-Times/express-web-service/issues
[license]: http://opensource.org/licenses/MIT
[node.js]: https://nodejs.org/
[npm]: https://www.npmjs.com/
[origami support]: mailto:origami-support@ft.com
[restify]: http://restify.com/
