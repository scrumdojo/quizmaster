Feature: Generate numerical question using AI
  Robin AI drafts a numerical question in chat with its answer, tolerance,
  and question explanation. The quiz maker reviews the draft and uses it to
  fill the question form before saving.

  @ai
  Scenario: Generate a numerical question
    Given I start creating a new question
    When I open Robin AI
    And I ask AI for numerical question:
      | Generate a numerical question about basic arithmetic |
    Then generated question 1 in Robin chat shows a numerical answer
    When I use the generated question
    Then the question is numerical
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
    Then generated question 1 in Robin chat shows a numerical answer
    And generated question 1 in Robin chat shows tolerance


  @ai
  Scenario: Numerical question with question explanation
    Given I start creating a new question
    When I open Robin AI
    And I ask AI for numerical question:
      | Generate a numerical question about geometry |
      | and include question explanation             |
    Then generated question 1 in Robin chat shows a numerical answer
    And generated question 1 in Robin chat shows question explanation


  @ai
  Scenario Outline: Vague tolerance request yields a non-zero tolerance bounded by the answer
    Given I start creating a new question
    When I open Robin AI
    And I ask AI for numerical question:
      | Generate a numerical question |
      | asking <prompt>               |
      | with correct answer <answer>  |
      | and include tolerance         |
    Then generated question 1 in Robin chat has numerical answer <answer>
    And generated question 1 in Robin chat has tolerance greater than "0"
    And generated question 1 in Robin chat has tolerance less than <answer-magnitude>

    Examples:
      | prompt            | answer | answer-magnitude |
      | "What is 5 / 2?"  | "2.5"  | "2.5"            |
      | "What is -5 / 2?" | "-2.5" | "2.5"            |


  @ai
  Scenario: Robin drafts a numerical question with answer and tolerance
    Given I start creating a new question
    When I open Robin AI
    And I ask Robin:
      | Ask one numerical question: what is 5 divided by 2? |
      | Allow a small tolerance in the answer.              |
    Then generated question 1 in Robin chat has numerical answer "2.5"
    And generated question 1 in Robin chat has tolerance greater than "0"
    And generated question 1 in Robin chat has tolerance less than "2.5"
