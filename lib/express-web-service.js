'use strict';

const defaults = require('lodash/defaults');
const fs = require('fs');
const os = require('os');
const path = require('path');

module.exports = expressWebService;

module.exports.defaults = {
	about: {},
	cacheControl: 'max-age=0, must-revalidate, no-cache, no-store',
	goodToGoTest: () => Promise.resolve(true),
	healthCheck: () => Promise.resolve([ { ok: true } ]),
	manifestPath: path.join(process.cwd(), 'package.json'),
	routes: [
		'about',
		'gtg',
		'health'
	]
};

// Create an express webservice middleware
function expressWebService(options) {

	// Default the passed in options
	options = defaults({}, options, module.exports.defaults);

	// Complete the about info
	if (typeof options.about.then === 'function') {
		options.aboutPromise = options.about;
		options.about = {};
	} else {
		options.aboutPromise = Promise.resolve(options.about);
	}
	options.aboutPromise.then(about => {
		options.about = about;
		completeAboutInfo(options);
	});

	// Main middleware function, routes to each of the
	// individual middleware below
	function middleware(request, response, next) {
		let path = request.path;
		if (typeof request.path === 'function') {
			path = request.path();
		}
		switch (path) {
			case '/__about':
				middleware.about(request, response, next);
				break;
			case '/__error':
				middleware.error(request, response, next);
				break;
			case '/__gtg':
				middleware.gtg(request, response, next);
				break;
			case '/__health':
				middleware.health(request, response, next);
				break;
			default:
				next();
				break;
		}
	}

	// Serve the __about endpoint
	middleware.about = (request, response, next) => {
		if (!options.routes.includes('about')) {
			return next();
		}
		response.status(200);
		response.set('Cache-Control', options.cacheControl);
		response.send(options.about);
	};

	// Serve the __error endpoint
	middleware.error = (request, response, next) => {
		if (!options.routes.includes('error')) {
			return next();
		}
		next(new Error('Intentional test error triggered by the /__error route'));
	};

	// Serve the __gtg endpoint
	// TODO
	middleware.gtg = (request, response, next) => {
		if (!options.routes.includes('gtg')) {
			return next();
		}

		// The __gtg endpoint needs to timeout after 3 seconds.
		// This race ensures that it does
		let goodToGoTimeout;
		return Promise.race([
			options.goodToGoTest(),
			new Promise((resolve, reject) => {
				goodToGoTimeout = setTimeout(() => {
					reject(new Error('gtg status generation timed out'));
				}, 3000);
			})
		])
		.then(status => {
			clearTimeout(goodToGoTimeout);
			if (!status) {
				throw new Error('Not OK, see /__health endpoint');
			}
			response.status(200);
			response.set('Cache-Control', options.cacheControl);
			response.set('Content-Type', 'text/plain; charset=utf-8');
			response.send('OK');
		})
		.catch(error => {
			clearTimeout(goodToGoTimeout);
			response.status(503);
			response.set('Content-Type', 'text/plain; charset=utf-8');
			response.send(error.message);
		});
	};

	// Serve the __health endpoint
	middleware.health = (request, response, next) => {
		if (!options.routes.includes('health')) {
			return next();
		}
		return options.healthCheck()
			.then(checks => {
				response.status(200);
				response.set('Cache-Control', options.cacheControl);
				response.send({
					schemaVersion: 1,
					name: options.about.name,
					systemCode: options.about.systemCode,
					description: options.about.purpose,
					checks: checks
				});
			})
			.catch(error => {
				response.status(500);
				response.set('Content-Type', 'text/plain; charset=utf-8');
				response.send(error.message);
			});
	};

	return middleware;
}

// Complete the about info in an options object
function completeAboutInfo(options) {

	// For backwards compatibility
	if (options.about.hostname) {
		options.about._hostname = options.about.hostname;
		delete options.about.hostname;
	}
	// Get hostname from OS if one is not specified
	if (!options.about._hostname) {
		options.about._hostname = os.hostname();
	}

	// Calculate the deployment date by checking the
	// last modified time of the manifest
	if (options.manifestPath && !options.about.dateDeployed) {
		fs.stat(options.manifestPath, (error, stat) => {
			if (!error) {
				options.about.dateDeployed = stat.mtime;
			}
		});
	}

	// Load the manifest to get the application
	// version if not specified
	if (options.manifestPath && !options.about.appVersion) {
		options.about.appVersion = require(options.manifestPath).version;
	}
}
