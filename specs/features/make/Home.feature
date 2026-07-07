Feature: Home Page Links
  The home page provides navigation links to the main entry points
  of the application.

  Scenario: Validate home page has correct navigation links
    Given I am on the home page
    Then I can create a new workspace


  Scenario: Jump back into an existing workspace from home
    Given workspace "Returning Team" with 1 questions
    And I am on the home page
    Then I do not see any workspace listed on home
    When I search workspaces from home
    * I open workspace "Returning Team" from home
    Then I see the workspace "Returning Team"
