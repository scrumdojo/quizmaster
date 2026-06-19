Feature: Evaluate quiz score
  After completing all quiz questions, the score is calculated:
  - Overall result: number correct, percentage, pass/fail against the pass score
  - Partial scoring: multiple choice questions can award 0, 0.5, or 1 point
  - Numerical questions: 0 or 1 point (correct if within tolerance)

  Scenario Outline: Quiz score with mixed question types
    Given workspace "Mixed" with questions
      | bookmark | question                            | answers                                      |
      | Capital  | What is the capital of Italy?       | Rome (*), Naples, Florence                   |
      | Planets  | Which are planets in solar system?  | Mars (*), Pluto, Venus (*), Titan, Earth (*) |
      | Boiling  | What is the boiling point of water? | 100 ±5                                       |
    And quiz "Mixed Quiz" with all questions
      | pass score | 66 |
    When I start the quiz
    * I answer "<capital>"
    * I answer "<planets>"
    * I answer "<boiling>"
    * I evaluate the quiz
    Then I see the quiz result
      | Correct Answers | Score        | Result   | Pass Score |
      | <points> / 3    | <percentage> | <result> | 66         |

    Examples:
      | capital | planets                   | boiling | points | percentage | result |
      | Rome    | Mars, Venus, Earth        | 100     | 3      | 100        | passed |
      | Rome    | Mars, Venus, Earth        | 106     | 2      | 67         | passed |
      | Rome    | Mars, Venus               | 100     | 2.5    | 83         | passed |
      | Naples  | Mars, Pluto               | 95      | 1      | 33         | failed |
      | Naples  | Mars, Venus, Earth, Pluto | 106     | 0.5    | 17         | failed |
      | Naples  | Pluto, Titan              | 106     | 0      | 0          | failed |


  Scenario Outline: Numerical answer within tolerance is shown as correct on the score page
    A numerical answer that lies inside the tolerance band must be displayed
    as the correct selection on the per-question feedback, not flagged as wrong.

    Given workspace "Tolerance display" with questions
      | bookmark | question                | answers    |
      | Boiling  | Boiling point of water? | 100 ±5     |
      | Pi       | Value of π?             | 1.01 ±0.01 |
    And quiz "Tolerance Quiz" with all questions
      | pass score | 100 |
    When I start the quiz
    * I answer "<boiling>"
    * I answer "<pi>"
    * I evaluate the quiz
    Then I see the quiz result
      | Correct Answers | Score | Result | Pass Score |
      | 2 / 2           | 100   | passed | 100        |
    And I see user select "<boiling>" for question "Boiling point of water?"
    And I see user select "<pi>" for question "Value of π?"

    Examples:
      | boiling | pi   |
      | 100     | 1.01 |
      | 95      | 1    |
      | 105     | 1.02 |


  Scenario: Quiz score in learning mode reflects first answers
    In learning mode, quiz takers can retake questions, but only the first answer
    counts towards the score. The quiz taker sees a single result, matching what
    the trainer sees in the quiz statistics.

    Given workspace "Learn Score" with questions
      | bookmark | question  | answers  |
      | Q1       | 1 + 1 = ? | 2 (*), 3 |
      | Q2       | 2 + 2 = ? | 4 (*), 5 |
    And quiz "Learn Quiz" with all questions
      | mode       | learn |
      | pass score | 100   |
    When I start the quiz
    * I answer correctly
    * I proceed to the next question
    * I answer incorrectly
    * I answer correctly
    * I evaluate the quiz
    Then I see the quiz result
      | Correct Answers | Score | Result | Pass Score |
      | 1 / 2           | 50    | failed | 100        |



  Scenario: Heavier question contributes more points to the score
    Given workspace "Weighted" with questions
      | question  | answers  |
      | 1 + 1 = ? | 2 (*), 3 |
      | 2 + 2 = ? | 4 (*), 5 |
    And quiz "Weighted Quiz" with weighted questions
      | question  | weight |
      | 1 + 1 = ? | 1      |
      | 2 + 2 = ? | 3      |
    When I start the quiz
    * I answer incorrectly
    * I answer correctly
    * I evaluate the quiz
    Then I see the quiz result
      | Correct Answers | Score | Weighted Score | Result | Pass Score |
      | 1 / 2           | 75    | 3 / 4          | passed | 50         |



  Scenario: All questions with weight 1 scores the same as unweighted
    Given workspace "Equal Weights" with questions
      | question  | answers  |
      | 1 + 1 = ? | 2 (*), 3 |
      | 2 + 2 = ? | 4 (*), 5 |
    And quiz "Equal Quiz" with weighted questions
      | question  | weight |
      | 1 + 1 = ? | 1      |
      | 2 + 2 = ? | 1      |
    When I start the quiz
    * I answer correctly
    * I answer incorrectly
    * I evaluate the quiz
    Then I see the quiz result
      | Correct Answers | Score | Weighted Score | Result | Pass Score |
      | 1 / 2           | 50    | 1 / 2          | passed | 50         |
