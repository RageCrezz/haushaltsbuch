describe("Registrierung", () => {
  it("zeigt einen Fehler wenn die Passwörter nicht übereinstimmen", () => {
    cy.visit("/register");

    cy.get("[data-testid='register-name']").type("Max Mustermann");
    cy.get("[data-testid='register-email']").type("max@example.com");
    cy.get("[data-testid='register-password']").type("Passwort123");
    cy.get("[data-testid='register-password-match']").type("Passwort456");
    cy.get("[data-testid='register-submit']").click();

    cy.get("[data-testid='register-error']")
      .should("have.length", 1)
      .first()
      .should("contain", "Die Passwörter stimmen nicht überein.");
  });
});
