'use strict';

const express = require('express');
const expressWebService = require('../..');
const restify = require('restify');

before(function(done) {

	this.expressApp = express();
	this.expressApp.use(expressWebService({
		about: {
			foo: 'bar'
		},
		manifestPath: `${__dirname}/mock-manifest.json`,
		routes: [
			'about',
			'error',
			'gtg',
			'health'
		]
	}));

	this.restifyApp = restify.createServer();
	this.restifyApp.get(/^\/__(about|gtg|health)$/, expressWebService({
		about: {
			foo: 'bar'
		},
		manifestPath: `${__dirname}/mock-manifest.json`,
		routes: [
			'about',
			'gtg',
			'health'
		]
	}));

	this.expressServer = this.expressApp.listen(() => {
		this.restifyServer = this.restifyApp.listen(done);
	});
});

after(function() {
	this.expressServer.close();
	this.restifyServer.close();
});
