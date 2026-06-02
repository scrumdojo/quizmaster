Feature: Questions used in a quiz are visually marked in the workspace

  Scenario: Question included in a quiz shows a Used badge
    Given workspace "Used" with questions
      | question  | answers  |
      | 2 + 2 = ? | 4 (*), 5 |
      | 3 * 3 = ? | 9 (*), 6 |
    And quiz "My Quiz" with questions "2 + 2 = ?"
    When I open the workspace
    And I click the "Questions" tab
    Then I see question "2 + 2 = ?" marked as used
    And I do not see question "3 * 3 = ?" marked as used
