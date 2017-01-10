'use strict';

const request = require('supertest');

describe('ft-express-web-service', function() {

	describe('default options', function() {

		it('has a /__gtg endpoint which returns 200', function() {
			return request(this.app)
				.get('/__gtg')
				.expect('Cache-Control', 'no-store')
				.expect('Content-Type', 'text/plain; charset=utf-8')
				.expect(200);
		});

		it('has a /__health endpoint which return JSON with a 200 which follows the schema', function() {
			return request(this.app)
				.get('/__health')
				.expect('Cache-Control', 'no-store')
				.expect('Content-Type', 'application/json; charset=utf-8')
				.expect(200);
		});

		it('has a /__about endpoint which returns JSON with a 200', function() {
			return request(this.app)
				.get('/__about')
				.expect('Cache-Control', 'no-store')
				.expect('Content-Type', 'application/json; charset=utf-8')
				.expect(200);
		});

		it('has a /__error endpoint which returns JSON with a 200', function() {
			return request(this.app)
				.get('/__error')
				.expect('Content-Type', 'text/html; charset=utf-8')
				.expect(500);
		});

	});

});
