/** @type {import('ts-jest').JestConfigWithTsJest} */
module.exports = {
	preset: "ts-jest",
	testEnvironment: "node",
	rootDir: "./",
	transform: {
		"^.+\\.ts?$": "ts-jest",
	},
	coverageDirectory: "<rootDir>/coverage",
	testPathIgnorePatterns: ["<rootDir>/node_modules/"],
	moduleFileExtensions: ["ts", "tsx", "js", "jsx"],
	coverageReporters: ["json", "lcov", "html"],
	projects: [
		{
			displayName: "core",
			testEnvironment: "node",
			transform: {
				"^.+\\.ts?$": "ts-jest",
			},
			testMatch: ["<rootDir>/packages/core/**/*.test.ts"],
			testPathIgnorePatterns: ["<rootDir>/node_modules/"],
		},
	],
};
