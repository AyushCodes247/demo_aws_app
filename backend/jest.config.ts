export default {
  testEnvironment: "node",

  // Discover TypeScript tests inside src/tests
  testMatch: ["<rootDir>/src/tests/**/*.test.ts"],

  // Transform TypeScript files using Babel
  transform: {
    "^.+\\.tsx?$": "babel-jest",
  },

  // Resolve TypeScript path aliases and ESM-style .js imports
  moduleNameMapper: {
    "^@middlewares/(.*)\\.js$": "<rootDir>/src/middlewares/$1",
    "^@middlewares/(.*)$": "<rootDir>/src/middlewares/$1",

    "^@models/(.*)\\.js$": "<rootDir>/src/models/$1",
    "^@models/(.*)$": "<rootDir>/src/models/$1",

    "^@routes/(.*)\\.js$": "<rootDir>/src/routes/$1",
    "^@routes/(.*)$": "<rootDir>/src/routes/$1",

    "^@controllers/(.*)\\.js$": "<rootDir>/src/controllers/$1",
    "^@controllers/(.*)$": "<rootDir>/src/controllers/$1",

    "^@utils/(.*)\\.js$": "<rootDir>/src/utils/$1",
    "^@utils/(.*)$": "<rootDir>/src/utils/$1",

    "^@configs/(.*)\\.js$": "<rootDir>/src/configs/$1",
    "^@configs/(.*)$": "<rootDir>/src/configs/$1",

    "^@services/(.*)\\.js$": "<rootDir>/src/services/$1",
    "^@services/(.*)$": "<rootDir>/src/services/$1",

    "^@schemas/(.*)\\.js$": "<rootDir>/src/schemas/$1",
    "^@schemas/(.*)$": "<rootDir>/src/schemas/$1",

    "^@/(.*)\\.js$": "<rootDir>/src/$1",
    "^@/(.*)$": "<rootDir>/src/$1",

    "^middlewares/(.*)\\.js$": "<rootDir>/src/middlewares/$1",
    "^middlewares/(.*)$": "<rootDir>/src/middlewares/$1",

    // Remove .js extensions from relative imports during test resolution
    "^(\\.{1,2}/.*)\\.js$": "$1",
  },

  // Keep test output concise
  clearMocks: true,
  restoreMocks: true,
};
