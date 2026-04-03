declare namespace Cypress {
  interface Chainable {
    setupTestUser(): Chainable<void>;
    loginAsTestUser(): Chainable<void>;
  }
}
