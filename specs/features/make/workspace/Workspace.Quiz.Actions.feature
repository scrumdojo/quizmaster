Feature: Quiz row action buttons

  Scenario: Quiz row shows Share and Actions dropdown
    Given workspace "Actions" with 1 quizzes
    When I open the workspace
    Then I see "Share" button for quiz "Quiz 1"
    And I see "Actions" button for quiz "Quiz 1"
    And "Edit" is hidden for quiz "Quiz 1"
    And the "Actions" button is collapsed for quiz "Quiz 1"
    When I open the quiz actions for "Quiz 1"
    Then the "Actions" button is expanded for quiz "Quiz 1"
    And "Edit" is visible in the quiz actions for "Quiz 1"
