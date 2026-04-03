describe("App Flow", () => {
  function addDashboardEntry(buttonTestId, name, amount) {
    cy.get(`[data-testid='${buttonTestId}']`).should("be.visible").click();
    cy.get("[data-testid='modal-name-input']").should("be.visible").type(name);
    cy.get("[data-testid='modal-amount-input']").type(amount, { force: true });
    cy.get("[data-testid='modal-submit']").click();
    cy.get("[data-testid='modal-name-input']").should("not.exist");
    cy.contains(name).should("be.visible");
  }

  beforeEach(() => {
    cy.setupTestUser();
    cy.loginAsTestUser();
  });

  it("setzt Gehalt, legt Fixkosten an und erstellt Einnahmen und Ausgaben", () => {
    cy.intercept("PATCH", "/api/profile").as("saveProfile");
    cy.intercept("POST", "/api/auth/session").as("updateSession");

    cy.contains("a", "Einstellungen").click();
    cy.url().should("include", "/profil");

    cy.get("[data-testid='profile-name-input']").clear().type("E2E User");
    cy.get("[data-testid='profile-salary-input']").clear().type("350000");
    cy.get("[data-testid='profile-add-fixed-cost']").click();
    cy.get("[data-testid='modal-name-input']").type("Miete");
    cy.get("[data-testid='modal-amount-input']").type("95000");
    cy.get("[data-testid='modal-submit']").click();
    cy.get("input").filter("[value='Miete']").should("have.length.at.least", 1);
    cy.get("[data-testid='profile-save']").click();
    cy.wait("@saveProfile");
    cy.wait("@updateSession");
    cy.location("pathname").should("eq", "/profil");
    cy.get("[data-testid='profile-save']").should("be.visible");

    cy.contains("a", "Dashboard").click();
    cy.location("pathname").should("eq", "/dashboard");
    cy.get("[data-testid='dashboard-add-income']").should("be.visible");

    addDashboardEntry("dashboard-add-income", "Bonus", "50000");
    addDashboardEntry("dashboard-add-income", "Freelance", "120000");
    addDashboardEntry("dashboard-add-income", "Geschenk", "25000");

    addDashboardEntry("dashboard-add-expense", "Strom", "12000");
    addDashboardEntry("dashboard-add-expense", "Einkauf", "18000");
    addDashboardEntry("dashboard-add-expense", "Internet", "4500");

    cy.contains("Bonus").should("be.visible");
    cy.contains("Freelance").should("be.visible");
    cy.contains("Geschenk").should("be.visible");
    cy.contains("Strom").should("be.visible");
    cy.contains("Einkauf").should("be.visible");
    cy.contains("Internet").should("be.visible");
  });
});
