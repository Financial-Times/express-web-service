'use strict';

const assert = require('proclaim');
const mockery = require('mockery');
const path = require('path');
const sinon = require('sinon');

describe('lib/express-web-service', () => {
	let defaults;
	let expressWebService;
	let express;
	let fs;
	let manifest;
	let os;

	beforeEach(() => {
		defaults = sinon.spy(require('lodash/defaults'));
		mockery.registerMock('lodash/defaults', defaults);

		express = require('../mock/express.mock');

		fs = require('../mock/fs.mock');
		mockery.registerMock('fs', fs);

		manifest = {
			version: '4.5.6'
		};
		mockery.registerMock('mock-manifest-path', manifest);

		os = require('../mock/os.mock');
		mockery.registerMock('os', os);

		expressWebService = require('../../..');
	});

	it('exports a function', () => {
		assert.isFunction(expressWebService);
	});

	it('has a `defaults` property', () => {
		assert.isObject(expressWebService.defaults);
	});

	describe('.defaults', () => {

		it('has an `about` property', () => {
			assert.deepEqual(expressWebService.defaults.about, {});
		});

		it('has a `cacheControl` property', () => {
			assert.deepEqual(expressWebService.defaults.cacheControl, 'max-age=0, must-revalidate, no-cache, no-store');
		});

		it('has a `goodToGoTest` property', () => {
			assert.isFunction(expressWebService.defaults.goodToGoTest);
			assert.instanceOf(expressWebService.defaults.goodToGoTest(), Promise);
			return expressWebService.defaults.goodToGoTest().then(value => {
				assert.isTrue(value);
			});
		});

		it('has a `healthCheck` property', () => {
			assert.isFunction(expressWebService.defaults.healthCheck);
			assert.instanceOf(expressWebService.defaults.healthCheck(), Promise);
			return expressWebService.defaults.healthCheck().then(value => {
				assert.deepEqual(value, []);
			});
		});

		it('has a `manifestPath` property', () => {
			assert.strictEqual(expressWebService.defaults.manifestPath, path.join(process.cwd(), 'package.json'));
		});

		it('has a `routes` property', () => {
			assert.deepEqual(expressWebService.defaults.routes, [
				'about',
				'gtg',
				'health'
			]);
		});

	});

	describe('expressWebService(options)', () => {
		let defaultedOptions;
		let healthChecks;
		let middleware;
		let options;

		beforeEach(() => {
			healthChecks = [
				'mock-health-check-object'
			];
			options = {
				about: {
					_hostname: 'mock-hostname',
					appVersion: '1.2.3',
					dateDeployed: new Date('2017-01-01'),
					foo: 'bar',
					name: 'mock-about'
				},
				cacheControl: 'mock-cache-control',
				goodToGoTest: () => Promise.resolve(true),
				healthCheck: () => Promise.resolve(healthChecks),
				manifestPath: 'mock-manifest-path',
				routes: [
					'about',
					'error',
					'gtg',
					'health'
				]
			};
			middleware = expressWebService(options);
			defaultedOptions = (defaults.firstCall ? defaults.firstCall.returnValue : {});
		});

		it('defaults the passed in options', () => {
			assert.isObject(defaults.firstCall.args[0]);
			assert.strictEqual(defaults.firstCall.args[1], options);
			assert.strictEqual(defaults.firstCall.args[2], expressWebService.defaults);
		});

		it('returns a middleware function', () => {
			assert.isFunction(middleware);
		});

		describe('middleware(request, response, next)', () => {
			let next;

			beforeEach(() => {
				next = sinon.spy();
				sinon.stub(middleware, 'about');
				sinon.stub(middleware, 'error');
				sinon.stub(middleware, 'gtg');
				sinon.stub(middleware, 'health');
				middleware(express.mockRequest, express.mockResponse, next);
			});

			it('calls `next` with no error', () => {
				assert.calledOnce(next);
				assert.calledWithExactly(next);
			});

			describe('when `request.path` is `/__about`', () => {

				beforeEach(() => {
					next.reset();
					express.mockRequest.path = '/__about';
					middleware(express.mockRequest, express.mockResponse, next);
				});

				it('calls the `middleware.about` function with the request, response, and next function', () => {
					assert.calledOnce(middleware.about);
					assert.calledWithExactly(middleware.about, express.mockRequest, express.mockResponse, next);
				});

				it('does not call `next`', () => {
					assert.notCalled(next);
				});

			});

			describe('when `request.path` is `/__error`', () => {

				beforeEach(() => {
					next.reset();
					express.mockRequest.path = '/__error';
					middleware(express.mockRequest, express.mockResponse, next);
				});

				it('calls the `middleware.error` function with the request, response, and next function', () => {
					assert.calledOnce(middleware.error);
					assert.calledWithExactly(middleware.error, express.mockRequest, express.mockResponse, next);
				});

				it('does not call `next`', () => {
					assert.notCalled(next);
				});

			});

			describe('when `request.path` is `/__gtg`', () => {

				beforeEach(() => {
					next.reset();
					express.mockRequest.path = '/__gtg';
					middleware(express.mockRequest, express.mockResponse, next);
				});

				it('calls the `middleware.gtg` function with the request, response, and next function', () => {
					assert.calledOnce(middleware.gtg);
					assert.calledWithExactly(middleware.gtg, express.mockRequest, express.mockResponse, next);
				});

				it('does not call `next`', () => {
					assert.notCalled(next);
				});

			});

			describe('when `request.path` is `/__health`', () => {

				beforeEach(() => {
					next.reset();
					express.mockRequest.path = '/__health';
					middleware(express.mockRequest, express.mockResponse, next);
				});

				it('calls the `middleware.health` function with the request, response, and next function', () => {
					assert.calledOnce(middleware.health);
					assert.calledWithExactly(middleware.health, express.mockRequest, express.mockResponse, next);
				});

				it('does not call `next`', () => {
					assert.notCalled(next);
				});

			});

		});

		describe('middleware.about(request, response, next)', () => {
			let next;

			beforeEach(() => {
				next = sinon.spy();
				middleware.about(express.mockRequest, express.mockResponse, next);
			});

			it('sends a 200 status code', () => {
				assert.calledOnce(express.mockResponse.status);
				assert.calledWithExactly(express.mockResponse.status, 200);
			});

			it('sets the `Cache-Control` header', () => {
				assert.called(express.mockResponse.set);
				assert.calledWithExactly(express.mockResponse.set, 'Cache-Control', 'mock-cache-control');
			});

			it('sends a JSON response containing the about info', () => {
				assert.calledOnce(express.mockResponse.send);
				assert.calledWithExactly(express.mockResponse.send, defaultedOptions.about);
			});

			it('does not call `next`', () => {
				assert.notCalled(next);
			});

		});

		describe('middleware.error(request, response, next)', () => {
			let next;

			beforeEach(() => {
				next = sinon.spy();
				middleware.error(express.mockRequest, express.mockResponse, next);
			});

			it('calls `next` with an intentional error', () => {
				assert.calledOnce(next);
				assert.instanceOf(next.firstCall.args[0], Error);
				assert.strictEqual(next.firstCall.args[0].message, 'Intentional test error triggered by the /__error route');
			});

		});

		describe('middleware.gtg(request, response, next)', () => {
			let next;

			beforeEach(() => {
				next = sinon.spy();
				return middleware.gtg(express.mockRequest, express.mockResponse, next);
			});

			it('sends a 200 status code', () => {
				assert.calledOnce(express.mockResponse.status);
				assert.calledWithExactly(express.mockResponse.status, 200);
			});

			it('sets the `Cache-Control` header', () => {
				assert.called(express.mockResponse.set);
				assert.calledWithExactly(express.mockResponse.set, 'Cache-Control', 'mock-cache-control');
			});

			it('sends a text response set to "OK"', () => {
				assert.called(express.mockResponse.set);
				assert.calledWithExactly(express.mockResponse.set, 'Content-Type', 'text/plain; charset=utf-8');
				assert.calledOnce(express.mockResponse.send);
				assert.calledWithExactly(express.mockResponse.send, 'OK');
			});

			it('does not call `next`', () => {
				assert.notCalled(next);
			});

			describe('when `options.goodToGoTest` returns a promise that resolves to `false`', () => {

				beforeEach(() => {
					express.mockResponse.send.reset();
					express.mockResponse.set.reset();
					express.mockResponse.status.reset();
					defaultedOptions.goodToGoTest = () => Promise.resolve(false);
					return middleware.gtg(express.mockRequest, express.mockResponse, next);
				});

				it('sends a 503 status code', () => {
					assert.calledOnce(express.mockResponse.status);
					assert.calledWithExactly(express.mockResponse.status, 503);
				});

				it('sends a text response containing an error message', () => {
					assert.called(express.mockResponse.set);
					assert.calledWithExactly(express.mockResponse.set, 'Content-Type', 'text/plain; charset=utf-8');
					assert.calledOnce(express.mockResponse.send);
					assert.calledWithExactly(express.mockResponse.send, 'Not OK, see /__health endpoint');
				});

				it('does not call `next`', () => {
					assert.notCalled(next);
				});

			});

			describe('when `options.goodToGoTest` returns a promise that rejects', () => {
				let gtgError;

				beforeEach(() => {
					express.mockResponse.send.reset();
					express.mockResponse.set.reset();
					express.mockResponse.status.reset();
					gtgError = new Error('gtg error');
					defaultedOptions.goodToGoTest = () => Promise.reject(gtgError);
					return middleware.gtg(express.mockRequest, express.mockResponse, next);
				});

				it('sends a 503 status code', () => {
					assert.calledOnce(express.mockResponse.status);
					assert.calledWithExactly(express.mockResponse.status, 503);
				});

				it('sends a text response containing the error message', () => {
					assert.called(express.mockResponse.set);
					assert.calledWithExactly(express.mockResponse.set, 'Content-Type', 'text/plain; charset=utf-8');
					assert.calledOnce(express.mockResponse.send);
					assert.calledWithExactly(express.mockResponse.send, 'gtg error');
				});

				it('does not call `next`', () => {
					assert.notCalled(next);
				});

			});

			describe('when `options.goodToGoTest` takes more than 3 seconds to resolve', () => {
				let clock;
				let promiseRaceBackup;

				beforeEach(() => {
					express.mockResponse.send.reset();
					express.mockResponse.set.reset();
					express.mockResponse.status.reset();
					clock = sinon.useFakeTimers();
					defaultedOptions.goodToGoTest = () => new Promise(resolve => {
						setTimeout(resolve, 4000);
					});

					// Nasty hack to ensure timer ticks at the correct time
					promiseRaceBackup = Promise.race;
					Promise.race = promises => {
						const promise = promiseRaceBackup.call(Promise, promises);
						clock.tick(3001);
						return promise;
					};

					return middleware.gtg(express.mockRequest, express.mockResponse, next);
				});

				afterEach(() => {
					Promise.race = promiseRaceBackup;
					clock.restore();
				});

				it('sends a 503 status code', () => {
					assert.calledOnce(express.mockResponse.status);
					assert.calledWithExactly(express.mockResponse.status, 503);
				});

				it('sends a text response containing an error message', () => {
					assert.called(express.mockResponse.set);
					assert.calledWithExactly(express.mockResponse.set, 'Content-Type', 'text/plain; charset=utf-8');
					assert.calledOnce(express.mockResponse.send);
					assert.calledWithExactly(express.mockResponse.send, 'gtg status generation timed out');
				});

				it('does not call `next`', () => {
					assert.notCalled(next);
				});

			});

		});

		describe('middleware.health(request, response, next)', () => {
			let next;

			beforeEach(() => {
				next = sinon.spy();
				return middleware.health(express.mockRequest, express.mockResponse, next);
			});

			it('sends a 200 status code', () => {
				assert.calledOnce(express.mockResponse.status);
				assert.calledWithExactly(express.mockResponse.status, 200);
			});

			it('sets the `Cache-Control` header', () => {
				assert.called(express.mockResponse.set);
				assert.calledWithExactly(express.mockResponse.set, 'Cache-Control', 'mock-cache-control');
			});

			it('sends a JSON response containing the health-check info', () => {
				assert.calledOnce(express.mockResponse.send);
				assert.deepEqual(express.mockResponse.send.firstCall.args[0], {
					schemaVersion: 1,
					name: defaultedOptions.about.name,
					systemCode: defaultedOptions.about.systemCode,
					description: defaultedOptions.about.purpose,
					checks: healthChecks
				});
			});

			it('does not call `next`', () => {
				assert.notCalled(next);
			});

			describe('when `options.healthCheck` returns a promise that rejects', () => {
				let healthCheckError;

				beforeEach(() => {
					express.mockResponse.send.reset();
					express.mockResponse.set.reset();
					express.mockResponse.status.reset();
					healthCheckError = new Error('health check error');
					defaultedOptions.healthCheck = () => Promise.reject(healthCheckError);
					return middleware.health(express.mockRequest, express.mockResponse, next);
				});

				it('sends a 500 status code', () => {
					assert.calledOnce(express.mockResponse.status);
					assert.calledWithExactly(express.mockResponse.status, 500);
				});

				it('sends a text response containing the error message', () => {
					assert.called(express.mockResponse.set);
					assert.calledWithExactly(express.mockResponse.set, 'Content-Type', 'text/plain; charset=utf-8');
					assert.calledOnce(express.mockResponse.send);
					assert.calledWithExactly(express.mockResponse.send, 'health check error');
				});

				it('does not call `next`', () => {
					assert.notCalled(next);
				});

			});

		});

		describe('when `options.routes` does not include "about"', () => {

			beforeEach(() => {
				options.routes = [
					'error',
					'gtg',
					'health'
				];
				middleware = expressWebService(options);
			});

			describe('middleware.about(request, response, next)', () => {
				let next;

				beforeEach(() => {
					next = sinon.spy();
					middleware.about(express.mockRequest, express.mockResponse, next);
				});

				it('does not send a response', () => {
					assert.notCalled(express.mockResponse.send);
				});

				it('calls `next` with no error', () => {
					assert.calledOnce(next);
					assert.calledWithExactly(next);
				});

			});

		});

		describe('when `options.routes` does not include "error"', () => {

			beforeEach(() => {
				options.routes = [
					'about',
					'gtg',
					'health'
				];
				middleware = expressWebService(options);
			});

			describe('middleware.error(request, response, next)', () => {
				let next;

				beforeEach(() => {
					next = sinon.spy();
					middleware.error(express.mockRequest, express.mockResponse, next);
				});

				it('calls `next` with no error', () => {
					assert.calledOnce(next);
					assert.calledWithExactly(next);
				});

			});

		});

		describe('when `options.routes` does not include "gtg"', () => {

			beforeEach(() => {
				options.routes = [
					'about',
					'error',
					'health'
				];
				middleware = expressWebService(options);
			});

			describe('middleware.gtg(request, response, next)', () => {
				let next;

				beforeEach(() => {
					next = sinon.spy();
					middleware.gtg(express.mockRequest, express.mockResponse, next);
				});

				it('does not send a response', () => {
					assert.notCalled(express.mockResponse.send);
				});

				it('calls `next` with no error', () => {
					assert.calledOnce(next);
					assert.calledWithExactly(next);
				});

			});

		});

		describe('when `options.routes` does not include "health"', () => {

			beforeEach(() => {
				options.routes = [
					'about',
					'error',
					'gtg'
				];
				middleware = expressWebService(options);
			});

			describe('middleware.health(request, response, next)', () => {
				let next;

				beforeEach(() => {
					next = sinon.spy();
					middleware.health(express.mockRequest, express.mockResponse, next);
				});

				it('does not send a response', () => {
					assert.notCalled(express.mockResponse.send);
				});

				it('calls `next` with no error', () => {
					assert.calledOnce(next);
					assert.calledWithExactly(next);
				});

			});

		});

		describe('when `options.about.dateDeployed` is not set', () => {
			let stat;

			beforeEach(() => {
				stat = {
					mtime: new Date('2017-01-11')
				};
				fs.stat.yields(null, stat);

				delete options.about.dateDeployed;
				middleware = expressWebService(options);
				return defaultedOptions.aboutPromise;
			});

			it('stats the manifest file', () => {
				assert.calledOnce(fs.stat);
				assert.calledWith(fs.stat, 'mock-manifest-path');
			});

			it('sets `options.about.dateDeployed` to the manifest file modified time', () => {
				assert.strictEqual(defaultedOptions.about.dateDeployed, stat.mtime);
			});

			describe('when the stat errors', () => {
				let statError;

				beforeEach(() => {
					statError = new Error('stat error');
					fs.stat.yields(statError);

					delete options.about.dateDeployed;
					middleware = expressWebService(options);
					return defaultedOptions.aboutPromise;
				});

				it('does not set `options.about.dateDeployed`', () => {
					assert.isUndefined(defaultedOptions.about.dateDeployed);
				});

			});

		});

		describe('when `options.about.hostname` is set', () => {

			beforeEach(() => {
				options.about.hostname = 'mock-hostname';
				delete options.about._hostname;
				middleware = expressWebService(options);
				return defaultedOptions.aboutPromise;
			});

			it('moves the value to `options.about._hostname`', () => {
				assert.isUndefined(defaultedOptions.about.hostname);
				assert.strictEqual(defaultedOptions.about._hostname, 'mock-hostname');
			});

		});

		describe('when `options.about._hostname` and `options.about.hostname` are not set', () => {

			beforeEach(() => {
				delete options.about._hostname;
				os.hostname.returns('mock–os-hostname');
				middleware = expressWebService(options);
				return defaultedOptions.aboutPromise;
			});

			it('gets `options.about._hostname` from the OS', () => {
				assert.strictEqual(defaultedOptions.about._hostname, 'mock–os-hostname');
			});

		});

		describe('when `options.about.appVersion` is not set', () => {

			beforeEach(() => {
				delete options.about.appVersion;
				middleware = expressWebService(options);
				return defaultedOptions.aboutPromise;
			});

			it('gets `options.about.appVersion` from the manifest', () => {
				assert.strictEqual(defaultedOptions.about.appVersion, manifest.version);
			});

		});

		describe('when `options.about` is a promise', () => {
			let resolvedAboutInfo;

			beforeEach(() => {
				resolvedAboutInfo = {
					_hostname: 'mock-hostname',
					appVersion: '1.2.3',
					dateDeployed: new Date('2017-01-01'),
					foo: 'bar'
				};
				options.about = Promise.resolve(resolvedAboutInfo);
				middleware = expressWebService(options);
				return defaultedOptions.aboutPromise;
			});

			describe('middleware.about(request, response, next)', () => {
				let next;

				beforeEach(() => {
					next = sinon.spy();
					middleware.about(express.mockRequest, express.mockResponse, next);
				});

				it('sends a JSON response containing the resolved about info', () => {
					assert.calledOnce(express.mockResponse.send);
					assert.calledWithExactly(express.mockResponse.send, resolvedAboutInfo);
				});

			});

		});

	});

});
