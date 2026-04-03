Cypress.Commands.add("setupTestUser", () => {
  cy.request("POST", "/api/test/setup");
});

Cypress.Commands.add("loginAsTestUser", () => {
  cy.visit("/");
  cy.get("[data-testid='login-email']").type("e2e@example.com");
  cy.get("[data-testid='login-password']").type("Passwort123");
  cy.get("[data-testid='login-submit']").click();
  cy.url().should("include", "/dashboard");
});
