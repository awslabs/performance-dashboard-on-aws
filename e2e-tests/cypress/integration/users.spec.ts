import UserListingPage from "../pages/UserListing";
import LoginPage from "../pages/Login";
import * as Chance from "chance";

const random = new Chance();

describe("Admin user", () => {
  beforeEach(() => {
    const loginPage = new LoginPage();
    loginPage.loginAsAdmin();
    loginPage.visit();
  });

  it("can create a new user and remove it", () => {
    const userListingPage = new UserListingPage();
    userListingPage.visit();

    const addUsersPage = userListingPage.goToAddUser();

    // Enter user details
    const username = random.word();
    const userEmail = username.concat("@example.com");

    addUsersPage.fillEmailAddress(userEmail);
    addUsersPage.selectAdminRole();
    addUsersPage.submit();

    // Verify user is in the table
    cy.contains(username);
    cy.contains(userEmail);

    // Delete the user
    userListingPage.removeUser(username);
    cy.contains("Successfully removed 1 user.");
  });
});
