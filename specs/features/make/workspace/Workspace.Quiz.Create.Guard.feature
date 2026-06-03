Feature: Quiz creation is always available

  Scenario: Can create a quiz with no questions in the workspace
    Given workspace "Guard"
    When I open the workspace
    And I start creating a new quiz
    Then I see the quiz creation page
