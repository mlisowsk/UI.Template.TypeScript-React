const path = require("path");
const ReplaceBundleStringPlugin = require('replace-bundle-webpack-plugin');

/**
 * See: https://stackoverflow.com/a/72219174/1288184
 * The MD4 algorithm is not available anymore in Node.js 17+ (because of library SSL 3).
 * In that case, silently replace MD4 by the MD5 algorithm.
 */
const crypto = require('crypto');
try {
	crypto.createHash('md4');
} catch (e) {
	console.warn('Crypto "MD4" is not supported anymore by this Node.js version');
	const origCreateHash = crypto.createHash;
	crypto.createHash = (alg, opts) => {
		return origCreateHash(alg === 'md4' ? 'md5' : alg, opts);
	};
}

module.exports = {
	mode: "development",
	entry: {
		shellui: "./src/shellui.ts",
		"Base.dashboard": "./src/dashboards/base-dashboard/Base.dashboard.ts",

		/**
		 * #TEMPLATED_TODO - Change this to use your own dashboard(s).
		 */
		"Sample.dashboard": "./src/dashboards/sample-dashboard/Sample.dashboard.tsx",
	},
	devtool: "cheap-source-map",
	module: {
		rules: [
			{
				test: /\.tsx?$/,
				use: "ts-loader",
				exclude: /node_modules/
			},
			{
				test: /\.css$/,
				use: ['style-loader', 'css-loader']
			}
		]
	},
	resolve: {
		extensions: [".tsx", ".ts", ".js"],
		alias: {
			mocha: "mocha/mocha.js",
		}
	},
	output: {
		filename: "[name].bundle.js",
		path: path.resolve(__dirname, "dist"),
		iife: false,	// prevent top level IIFE on Webpack 5 - need this so M-Files finds the OnNewShellUI entry point
		environment: {
			arrowFunction: false,	// WebBrowser control doesn't support arrow functions
			const: false,			// WebBrowser control doesn't support const keyword
			module: false
		},
	},
	optimization: {
		minimize: true,
		minimizer: [
			new TerserPlugin({
				terserOptions: {
					compress: true,	// set false for debugging readability
					format: { beautify: true },	// keep line breaks so M-Files error messages make sense (set false for production)
					/* compress: {
						defaults: true,
						properties: false,		// important: don't rewrite property access using the dot notation, e.g. foo["bar"] → foo.bar
					},*/
					//keep_fnames: true,
					//keep_classnames: true,
					ie8: true,	// important for M-Files Desktop compatibility
				},
			}),
		],
		concatenateModules: true	// needed for mode development to work on desktop
	},
	target: "browserslist",	// need a browerslist entry in package.json specifying "ie 8", otherwise won't work in M-Files Desktop
	externals: {
		MFiles: "MFiles",
		ShellUIModule: "ShellUIModule",
		MFilesDashboard: "window"
	},
	plugins: [
		// es6-promise polyfill compile has Promise.prototype.catch/finally which doesn't work with Desktop
		new ReplaceBundleStringPlugin([{
			partten: /Promise.prototype.catch /g,
			replacement: function () {
				return 'Promise.prototype[\'catch\']';
			}
		},
		{
			partten: /Promise.prototype.finally /g,
			replacement: function () {
				return 'Promise.prototype[\'finally\']';
			}
		}])
	]
};
