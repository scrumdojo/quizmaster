Feature: Generate numerical question preview from workspace using AI
  Robin AI can generate a numerical question preview directly on the
  workspace page without navigating to the question form first.
  Generated questions stay in Robin chat until the quiz maker confirms them.

  @ai
  Scenario: Generate a numerical question preview directly in workspace
    Given workspace "Workspace"
    And Robin AI will return these generated questions:
      | question       | answers |
      | What is 1 + 1? | 2       |
    When I open Robin AI
    And I ask AI for numerical question:
      | Generate a numerical question about basic arithmetic |
    Then I see the workspace "Workspace"
    And I see AI section
    And I see workspace question count 0
    And I do not see question "What is 1 + 1?" in the list
    And generated question 1 in Robin chat shows a numerical answer
    And generated question 1 in Robin chat has numerical answer "2"


  @ai
  Scenario: Generate a numerical question with tolerance preview directly in workspace
    Given workspace "Workspace"
    And Robin AI will return these generated questions:
      | question       | answers    |
      | What is 5 / 2? | 2.5 ± 0.25 |
    When I open Robin AI
    And I ask AI for numerical question:
      | Generate a numerical question about a physics calculation |
      | and include tolerance                                     |
    Then I see the workspace "Workspace"
    And I see AI section
    And I see workspace question count 0
    And I do not see question "What is 5 / 2?" in the list
    And generated question 1 in Robin chat has numerical answer "2.5"
    And generated question 1 in Robin chat shows tolerance


  @ai
  Scenario: Generate a numerical question with question explanation preview directly in workspace
    Given workspace "Workspace"
    And Robin AI will return these generated questions:
      | question               | answers | explanation                              |
      | What is triangle area? | 12      | Multiply base by height and divide by 2. |
    When I open Robin AI
    And I ask AI for numerical question:
      | Generate a numerical question about geometry |
      | and include question explanation             |
    Then I see the workspace "Workspace"
    And I see AI section
    And I see workspace question count 0
    And I do not see question "What is triangle area?" in the list
    And generated question 1 in Robin chat has numerical answer "12"
    And generated question 1 in Robin chat shows question explanation


  @ai
  Scenario Outline: Vague tolerance request from workspace yields a non-zero tolerance bounded by the answer in Robin chat
    Given workspace "Workspace"
    And Robin AI will return these generated questions:
      | question | answers                |
      | <prompt> | <answer> ± <tolerance> |
    When I open Robin AI
    And I ask AI for numerical question:
      | Generate a numerical question |
      | asking <prompt>               |
      | with correct answer <answer>  |
      | and include tolerance         |
    Then I see the workspace "Workspace"
    And I see AI section
    And I see workspace question count 0
    And I do not see question <prompt> in the list
    And generated question 1 in Robin chat has numerical answer <answer>
    And generated question 1 in Robin chat has tolerance greater than "0"
    And generated question 1 in Robin chat has tolerance less than <answer-magnitude>

    Examples:
      | prompt            | answer | tolerance | answer-magnitude |
      | "What is 5 / 2?"  | 2.5    | 0.25      | "2.5"            |
      | "What is -5 / 2?" | -2.5   | 0.25      | "2.5"            |
