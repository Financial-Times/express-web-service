'use strict';

const assert = require('proclaim');

describe('lib/express-web-service', () => {
	let expressWebService;

	beforeEach(() => {
		expressWebService = require('../../..');
	});

	it('exports a function', () => {
		assert.isFunction(expressWebService);
	});

});
