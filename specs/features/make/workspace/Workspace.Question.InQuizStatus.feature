Feature: "In Quiz" status tag for workspace questions

  Scenario: Question shows "In Quiz" tag with button style when part of a quiz
    Given workspace "InQuiz" with questions
      | question  | answers  |
      | 2 + 2 = ? | 4 (*), 5 |
      | 3 * 3 = ? | 9 (*), 6 |
    And quiz "My Quiz" with questions "2 + 2 = ?"
    When I open the workspace
    And I click the "Questions" tab
    Then I see "In Quiz" tag on question "2 + 2 = ?"
    And the "In Quiz" tag on question "2 + 2 = ?" uses outlined button styling
    And I do not see "In Quiz" tag on question "3 * 3 = ?"
