'use strict';

const sinon = require('sinon');

const express = module.exports = sinon.stub();
const mockApp = module.exports.mockApp = {
	disable: sinon.stub(),
	enable: sinon.stub(),
	engine: sinon.stub(),
	get: sinon.stub(),
	listen: sinon.stub(),
	locals: {},
	set: sinon.stub(),
	use: sinon.stub()
};
const mockServer = express.mockServer = {};

express.returns(mockApp);
mockApp.listen.returns(mockServer).yieldsAsync();

express.static = sinon.stub();
express.mockStaticMiddleware = sinon.stub();
express.static.returns(express.mockStaticMiddleware);

express.mockRequest = {
	app: mockApp,
	headers: {},
	path: '/',
	query: {},
	params: {}
};

express.mockResponse = {
	app: mockApp,
	locals: {},
	redirect: sinon.stub().returnsThis(),
	render: sinon.stub().returnsThis().yields(),
	send: sinon.stub().returnsThis(),
	set: sinon.stub().returnsThis(),
	status: sinon.stub().returnsThis()
};
