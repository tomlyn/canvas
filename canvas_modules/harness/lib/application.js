/*
 * Copyright 2017-2026 Elyra Authors
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

// ESLint Rule Overrides

/* eslint no-process-exit: 0 */
import express from "express";
import session from "express-session";
import compression from "compression";
import path from "path";
import { fileURLToPath } from "url";
import appConfig from "./utils/app-config.js";
import { APP_SESSION_KEY, API_PATH_V1, APP_PATH } from "./constants.js";
import log4js from "log4js";
import bodyParser from "body-parser";
import log4jsUtils from "./utils/log4js-util.js";

log4jsUtils.init();

const isProduction = process.env.NODE_ENV === "production";

const logger = log4js.getLogger("application");

// Controllers
import formsAPI from "../controllers/v1-forms-api.js";
import opsAPI from "../controllers/v1-ops-api.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

function create(callback) {
	var state = appConfig.init();
	if (!state) {
		callback(new Error("Failed to initialize application configuration."), null);
		return;
	}

	var app = express();
	// See: http://expressjs.com/en/guide/behind-proxies.html
	app.set("trust proxy", 1);
	app.use(compression());

	// Content Security Policy.
	// A fresh nonce is generated per request and placed in res.locals.cspNonce.
	// The nonce is used in style-src so CodeMirror 6 (style-mod/StyleModule) can
	// inject its <style> tags without requiring 'unsafe-inline'. The harness
	// exposes the nonce to the client via GET /nonce so App.js can pass it to
	// <CommonProperties propertiesConfig={{ cspNonce }}>.
	// script-src retains 'unsafe-inline' because the HMR dev toolchain injects
	// inline scripts; that is unrelated to the hardening work.
	// Remaining violations are logged via /csp-report for ongoing review.
	app.use((_req, res, next) => {
		res.locals.cspNonce = crypto.randomBytes(16).toString("base64");
		res.setHeader("Reporting-Endpoints", "csp-endpoint=\"/csp-report\"");
		res.setHeader(
			"Content-Security-Policy",
			[
				"default-src 'self'",
				"script-src 'self' 'unsafe-inline'",
				`style-src 'self' 'nonce-${res.locals.cspNonce}'`,
				"font-src 'self' data:",
				"img-src 'self' data:",
				"connect-src 'self'",
				"worker-src blob:",
				"report-uri /csp-report",
				"report-to csp-endpoint"
			].join("; ")
		);
		next();
	});

	// Nonce endpoint — the client fetches this once on mount to obtain the
	// current request's nonce value and pass it to CommonProperties.
	app.get("/nonce", (_req, res) => {
		res.json({ nonce: res.locals.cspNonce });
	});

	// CSP violation report endpoint — browsers POST here when the above policy
	// is violated. Each report is printed to the server console as a warning so
	// violations are visible without opening browser DevTools.
	app.post("/csp-report",
		bodyParser.json({ type: ["application/csp-report", "application/reports+json"], limit: "50kb" }),
		(req, res) => {
			// report-to sends an array; report-uri sends a single object
			const reports = Array.isArray(req.body) ? req.body : [req.body];
			reports.forEach((item) => {
				const report = item["csp-report"] || item.body;
				if (report) {
					logger.warn(
						`CSP violation: blocked-uri="${report["blocked-uri"] || report.blockedURL}" ` +
						`violated-directive="${report["violated-directive"] || report.effectiveDirective}" ` +
						`source-file="${report["source-file"] || report.sourceFile}" ` +
						`line=${report["line-number"] || report.lineNumber} ` +
						`col=${report["column-number"] || report.columnNumber}`
					);
				}
			});
			res.status(204).end();
		}
	);

	app.use(session({
		secret: APP_SESSION_KEY,
		resave: false,
		saveUninitialized: false,
		name: "testharness.sid"
	}));

	// Configure Development tools
	if (!isProduction) {
		logger.info("In development mode; using webpack with HMR");
		_configureHmr(app);
	}

	app.use(express.static(path.join(__dirname, "../.build")));

	app.use(log4jsUtils.getRequestLogger());

	const routerOptions = {
		caseSensitive: true,
		mergeParams: true
	};
	const v1Router = express.Router(routerOptions);
	app.use(API_PATH_V1, v1Router);

	v1Router.use(bodyParser.json({ limit: "10mb" }));
	v1Router.use(APP_PATH, formsAPI);
	v1Router.use(APP_PATH, opsAPI);

	callback(null, app);
}
async function _configureHmr(app) {

	/* eslint new-cap: 0 */
	/* eslint global-require: 0 */
	var hmrRouter = express.Router({
		caseSensitive: true,
		mergeParams: true
	});

	const webpack = await import("webpack");
	const webpackConfig = await import("../webpack.config.dev.cjs");
	const compiler = webpack.default(webpackConfig.default);

	// Note: publicPath should match the output directory as defined
	// in the webpack config, but we are applying this middleware to
	// a route mounted at constants.APP_PATH already
	const WebpackHotMiddleware = await import("webpack-hot-middleware");
	const WebpackDevMiddleware = await import("webpack-dev-middleware");

	hmrRouter.use(WebpackDevMiddleware.default(compiler, {
		publicPath: "/"
	}));
	hmrRouter.use(WebpackHotMiddleware.default(compiler));

	app.use(APP_PATH, hmrRouter);

	// load images and styles from asserts folder in development mode
	app.use(express.static(path.join(__dirname, "../assets")));
}

export default {
	create
};
