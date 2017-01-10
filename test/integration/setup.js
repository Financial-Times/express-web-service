'use strict';

const express = require('express');
const expressWebService = require('../..');

before(function(done) {
	this.app = express();
	expressWebService(this.app);
	this.server = this.app.listen(done);
});

after(function() {
	this.server.close();
});
