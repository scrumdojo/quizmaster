Feature: Return to the originating workspace tab after editing
  After saving an edit, the maker lands back on the same workspace tab
  they came from — not the default tab.

  Scenario: Saving a question edit returns to the Questions tab
    Given workspace "Navigation" with questions
      | question  | answers  |
      | 2 + 2 = ? | 4 (*), 5 |
    When I edit question "2 + 2 = ?" from the list
    And I submit the question
    Then the "Questions" tab is open


  Scenario: Saving a quiz edit returns to the Quizzes tab
    Given workspace "Navigation" with questions
      | question  | answers  |
      | 2 + 2 = ? | 4 (*), 5 |
      | 3 * 3 = ? | 9 (*), 6 |
    And quiz "Nav Quiz" with all questions
    When I navigate to edit quiz "Nav Quiz"
    And I submit the quiz
    Then the "Quizzes" tab is open
