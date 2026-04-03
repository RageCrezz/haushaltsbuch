import { defineConfig } from "cypress";

export default defineConfig({
  e2e: {
    baseUrl: "http://localhost:3334",
    supportFile: "cypress/support/e2e.js",
  },
  video: false,
});
