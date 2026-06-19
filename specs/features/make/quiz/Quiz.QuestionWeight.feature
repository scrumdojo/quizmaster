Feature: Question weight in quiz
  Each question in a quiz can be assigned a weight from 1 to 5 that controls
  how many points it contributes to the final score. The default weight is 1.
  Weights are set per question per quiz, not globally on the question.

  Background:
    Given workspace "Weights" with questions
      | question  | answers  |
      | 1 + 1 = ? | 2 (*), 3 |
      | 2 + 2 = ? | 4 (*), 5 |


  Scenario: Default question weight is 1
    When I start creating a new quiz
    Then I see weight 1 for question "1 + 1 = ?"
    And I see weight 1 for question "2 + 2 = ?"


  Scenario: Set question weight in quiz form
    When I start creating a new quiz
    * I enter quiz name "Weighted Quiz"
    * I select question "1 + 1 = ?"
    * I select question "2 + 2 = ?"
    * I set weight of question "2 + 2 = ?" to 3
    * I submit the quiz
    When I navigate to edit quiz "Weighted Quiz"
    Then I see weight 1 for question "1 + 1 = ?"
    And I see weight 3 for question "2 + 2 = ?"


  Scenario: Weight must be between 1 and 5
    When I start creating a new quiz
    And I set weight of question "1 + 1 = ?" to 6
    Then I see a validation error for the weight field
