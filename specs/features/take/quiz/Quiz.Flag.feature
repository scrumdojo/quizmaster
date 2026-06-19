Feature: Flag a quiz question as problematic
  While taking a quiz, a taker can flag a question they find problematic
  (confusing, ambiguous, open to multiple interpretations). A flag is saved
  with the taker's attempt and can be toggled off; each attempt is independent,
  so a new attempt starts with nothing flagged. Flagging never affects
  answering, navigation, or scoring.

  Background:
    Given workspace "Flagging" with questions
      | question  | answers  |
      | 1 + 1 = ? | 2 (*), 3 |
      | 2 + 2 = ? | 4 (*), 5 |
    And quiz "Quiz" with all questions
      | pass score | 75 |


  Scenario: Flag a question as problematic
    When I start quiz "Quiz"
    Then I see question "1 + 1 = ?"

    When I flag question "1 + 1 = ?" as problematic
    Then I see question "1 + 1 = ?" flagged as problematic


  Scenario: Evaluation waits for a pending flag save
    When I start quiz "Quiz"
    * I answer correctly
    Then I see question "2 + 2 = ?"

    When flag saves are delayed
    * I flag question "2 + 2 = ?" as problematic
    * I answer correctly
    * I try to evaluate the quiz while the flag save is pending
    * the delayed flag save completes
    Then I see the quiz result
      | Correct Answers | Score | Result | Pass Score |
      | 2 / 2           | 100   | passed | 75         |


  Scenario: Remove a problematic flag
    When I start quiz "Quiz"
    * I flag question "1 + 1 = ?" as problematic
    Then I see question "1 + 1 = ?" flagged as problematic

    When I remove the flag from question "1 + 1 = ?"
    Then I do not see question "1 + 1 = ?" flagged as problematic


  Scenario: A flag is remembered when navigating within the attempt
    When I start quiz "Quiz"
    * I flag question "1 + 1 = ?" as problematic
    * I skip the question
    Then I see question "2 + 2 = ?"

    When I go back to previous question
    Then I see question "1 + 1 = ?" flagged as problematic


  Scenario: A new attempt starts with no flags from the previous attempt
    When I start quiz "Quiz"
    * I flag question "1 + 1 = ?" as problematic
    Then I see question "1 + 1 = ?" flagged as problematic

    When I answer correctly
    * I answer correctly
    * I evaluate the quiz

    When I start quiz "Quiz"
    Then I see question "1 + 1 = ?"
    And I do not see question "1 + 1 = ?" flagged as problematic


  Scenario: Flagging a question does not affect the score
    When I start quiz "Quiz"
    * I flag question "1 + 1 = ?" as problematic
    * I answer correctly
    * I answer correctly
    * I evaluate the quiz
    Then I see the quiz result
      | Correct Answers | Score | Result | Pass Score |
      | 2 / 2           | 100   | passed | 75         |
