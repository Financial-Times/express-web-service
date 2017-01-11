'use strict';

const sinon = require('sinon');

const fs = module.exports = {
	stat: sinon.stub()
};

fs.mockStat = {};
fs.stat.yieldsAsync(null, fs.mockStat);
