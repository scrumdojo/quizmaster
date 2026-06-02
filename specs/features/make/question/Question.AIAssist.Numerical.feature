Feature: Generate numerical question using AI
  AI can generate a numerical question from a topic and prefill the
  numerical answer, tolerance, and question explanation before the
  question is saved.

  @ai
  Scenario: Generate a numerical question
    Given I start creating a new question
    When I open Robin AI
    And I ask AI for numerical question:
      | Generate a numerical question about basic arithmetic |
    Then Question field is not empty
    And the question is numerical choice
    And I see numerical answer field
    And I see non-empty numerical correct answer
    And I see tolerance "0"
    And I see empty question explanation
    When I submit the question
    Then the question is saved in the workspace


  @ai
  Scenario: Numerical question with tolerance
    Given I start creating a new question
    When I open Robin AI
    And I ask AI for numerical question:
      | Generate a numerical question about a physics calculation |
      | and include tolerance                                     |
    Then Question field is not empty
    And the question is numerical choice
    And I see non-empty numerical correct answer
    And I see non-empty tolerance


  @ai
  Scenario: Numerical question with question explanation
    Given I start creating a new question
    When I open Robin AI
    And I ask AI for numerical question:
      | Generate a numerical question about geometry |
      | and include question explanation             |
    Then Question field is not empty
    And the question is numerical choice
    And I see non-empty numerical correct answer
    And I see non-empty question explanation


  @ai
  Scenario Outline: Vague tolerance request yields a non-zero tolerance bounded by the answer
    Given I start creating a new question
    When I open Robin AI
    And I ask AI for numerical question:
      | Generate a numerical question |
      | asking <prompt>               |
      | with correct answer <answer>  |
      | and include tolerance         |
    Then Question field is not empty
    And the question is numerical choice
    And I see numerical correct answer <answer>
    And tolerance is greater than "0"
    And tolerance is less than <answer-magnitude>

    Examples:
      | prompt            | answer | answer-magnitude |
      | "What is 5 / 2?"  | "2.5"  | "2.5"            |
      | "What is -5 / 2?" | "-2.5" | "2.5"            |
