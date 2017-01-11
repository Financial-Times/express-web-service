'use strict';

const assert = require('proclaim');
const request = require('supertest');

describe('ft-express-web-service', function() {

	it('has a /__gtg endpoint which returns a text document with a 200', function() {
		return request(this.app)
			.get('/__gtg')
			.expect('Cache-Control', 'max-age=0, must-revalidate, no-cache, no-store')
			.expect('Content-Type', 'text/plain; charset=utf-8')
			.expect(200);
	});

	it('has a /__health endpoint which returns JSON with a 200 which follows the schema', function() {
		return request(this.app)
			.get('/__health')
			.expect('Cache-Control', 'max-age=0, must-revalidate, no-cache, no-store')
			.expect('Content-Type', 'application/json; charset=utf-8')
			.expect(200);
	});

	it('has a /__about endpoint which returns JSON with a 200', function() {
		return request(this.app)
			.get('/__about')
			.expect('Cache-Control', 'max-age=0, must-revalidate, no-cache, no-store')
			.expect('Content-Type', 'application/json; charset=utf-8')
			.expect(response => {
				assert.strictEqual(response.body.foo, 'bar');
				assert.strictEqual(response.body._hostname, require('os').hostname());
				assert.strictEqual(response.body.appVersion, '1.2.3');
				assert.match(response.body.dateDeployed, /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}.\d{3}/);
			})
			.expect(200);
	});

	it('has a /__error endpoint which returns an error message with a 500', function() {
		return request(this.app)
			.get('/__error')
			.expect('Content-Type', 'text/html; charset=utf-8')
			.expect(500);
	});

});