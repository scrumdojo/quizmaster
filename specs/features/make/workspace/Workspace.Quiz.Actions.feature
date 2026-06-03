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


  Scenario: Explain questions used in quizzes
    Given workspace "Workspace Help" with questions
      | question  | answers  |
      | 2 + 2 = ? | 4 (*), 5 |
    And quiz "Math Quiz" with all questions
    When I open the workspace
    And I focus the help tooltip for the "In Quiz" action on question "2 + 2 = ?"
    Then I see help text explaining that the action lists quizzes using the question


  Scenario: Explain dry run
    Given workspace "Workspace Help" with 1 quizzes
    When I open the workspace
    And I open the quiz actions for "Quiz 1"
    And I focus the help tooltip for the "Dry run" action
    Then I see help text explaining that dry run ignores scheduling
    And I see help text explaining that other quiz rules still apply
