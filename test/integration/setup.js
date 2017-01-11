'use strict';

const express = require('express');
const expressWebService = require('../..');

before(function(done) {
	this.app = express();
	this.app.use(expressWebService({
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
	this.server = this.app.listen(done);
});

after(function() {
	this.server.close();
});
