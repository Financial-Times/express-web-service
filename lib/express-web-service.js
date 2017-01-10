module.exports = function(app, options) {
	var opts = options || {};

	opts.goodToGoTest = opts.goodToGoTest || defaultGoodToGo;
	opts.healthCheck = opts.healthCheck || defaultHealthCheck;
	opts.about = opts.about || {};
	opts.routes = opts.routes || ['about', 'gtg', 'health', 'error'];

	// Backwards compat
	if (opts.about.hostname) {
		opts.about._hostname = opts.about.hostname;
		delete opts.about.hostname;
	}


	if (opts.manifestPath && !opts.about.dateDeployed) {
		require('fs').stat(opts.manifestPath, function(err, stat) {
			opts.about.dateDeployed = stat.mtime;
		});
	}

	if (opts.manifestPath && !opts.about.appVersion) {
		opts.about.appVersion = require(opts.manifestPath).version;
	}

	if (!opts.about._hostname) {
		opts.about._hostname = require("os").hostname();
	}

	if (opts.routes.indexOf('about') !== -1) {
		app.get(/^\/__about$/, function(req, res) {
			res.set('Cache-Control', 'no-store');
			res.json(opts.about || {});
		});
	}

	if (opts.routes.indexOf('gtg') !== -1) {
		app.get(/\/__gtg$/, function(req, res) {

			res.set("Cache-Control", "no-store");
			res.set("Content-Type", "text/plain;charset=utf-8");

			function notOk() {
				res.statusCode = 503;
				res.send("Not OK, see /__health endpoint");
			}

			function ok() {
				res.send("OK");
			}

			// The GTG generation must timeout after 3 seconds and provide notice
			// of the timeout
			var goodToGoTimeout;
			Promise.race([
				opts.goodToGoTest(),
				new Promise(function(resolve, reject) {
					goodToGoTimeout = setTimeout(function() {
						resolve('timeout');
					}, 3000);
				})
			]).then(function(status) {
				clearTimeout(goodToGoTimeout);
				if (status === 'timeout') {
					res.send("gtg status generation timed out\n");
				} else {
					if (status) {
						ok();
					} else {
						notOk();
					}
				}
			}).catch(function(e) {
				notOk();
			});
		});
	}

	if (opts.routes.indexOf('health') !== -1) {
		app.get(/\/__health$/, function(req, res) {
			res.set('Cache-Control', 'no-store');
			res.set('Content-Type', 'application/json;charset=utf-8');

			opts.healthCheck().then(function(checks) {
				res.json({
					schemaVersion: 1,
					name: opts.about.name,
                    			systemCode: opts.about.systemCode || opts.about.name,
					description: opts.about.purpose,
					checks: checks
				});
			}).catch(function(e) {
				// TODO
			});
		});
	}

	if (opts.routes.indexOf('error') !== -1) {
		app.get(/\/__error$/, function(req, res) {
			throw new Error("Intentional test error thrown from /__error route");
		});
	}

	function defaultHealthCheck() {
		return Promise.resolve([]);
	}

	function defaultGoodToGo() {
		return Promise.resolve(true);
	}
};
