export default {
	root: true,
	env: {
		browser: true,
		es2024: true,
		node: true,
	},
	extends: ["eslint:recommended"],
	parserOptions: {
		ecmaVersion: 2024,
		sourceType: "module",
	},
	rules: {
		"no-unused-vars": "warn",
		"no-undef": "error",
	},
};
