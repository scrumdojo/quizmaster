Feature: Return to the originating workspace tab
  After creating or editing a question or quiz, the maker lands back on
  the same workspace tab they came from — not the default tab.

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


  Scenario: Saving a new question returns to the Questions tab
    Given workspace "Navigation"
    When I start creating a new question
    * I enter question "What is 2 + 2?"
    * I enter answers
      | 4 | * |
      | 5 |   |
    * I submit the question
    Then the "Questions" tab is open


  Scenario: Saving a new quiz returns to the Quizzes tab
    Given workspace "Navigation" with questions
      | question  | answers  |
      | 2 + 2 = ? | 4 (*), 5 |
      | 3 * 3 = ? | 9 (*), 6 |
    When I start creating a new quiz
    * I enter quiz name "New Quiz"
    * I select exam mode
    * I select question "2 + 2 = ?"
    * I select question "3 * 3 = ?"
    * I submit the quiz
    Then the "Quizzes" tab is open
