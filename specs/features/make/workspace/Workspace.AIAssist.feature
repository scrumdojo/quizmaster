Feature: Generate question preview from workspace using AI
  Robin AI is available directly on the workspace page, so a quiz maker
  can generate question previews without opening the question form first.
  Generated questions stay in Robin chat until the quiz maker saves them.

  @ai
  Scenario: Open Robin AI from workspace
    Given workspace "Workspace"
    When I open Robin AI
    Then I see AI section


  @ai
  Scenario: Workspace Robin saves a single draft
    Given workspace "Workspace"
    When I remember workspace question count
    And I open Robin AI
    And I ask Robin:
      | Ask 2 questions about Czech geography |
    Then I see 2 generated questions in Robin chat
    When I save generated question 1
    Then workspace question count increased by 1


  @ai
  Scenario: Save all persists every draft
    Given workspace "Workspace"
    When I remember workspace question count
    And I open Robin AI
    And I ask Robin:
      | Ask 2 questions about Czech geography |
    Then I see 2 generated questions in Robin chat
    When I save all generated questions
    Then workspace question count increased by 2


  @ai
  Scenario: One turn produces mixed question types
    Given workspace "Workspace"
    When I open Robin AI
    And I ask Robin:
      | Ask exactly 3 questions about basic science:         |
      | one single-choice with exactly 1 correct answer,     |
      | one multiple-choice with at least 2 correct answers, |
      | and one numerical question                           |
    Then I see 3 generated questions in Robin chat
    And at least 1 generated question in Robin chat is numerical
    And at least 1 generated question in Robin chat has at least 2 highlighted correct answers
    And at least 1 generated question in Robin chat has exactly 1 highlighted correct answer


  @ai
  Scenario: Robin shows per-answer and per-question explanations
    Given workspace "Workspace"
    When I open Robin AI
    And I ask Robin:
      | Ask one single-choice question about nuclear physics |
      | and explain each answer and the question itself      |
    Then generated question 1 in Robin chat shows question explanation
    And every answer of generated question 1 in Robin chat shows an explanation


  @ai
  Scenario: Robin refuses a duplicate with a chat message and lets the maker continue
    Given workspace "Workspace"
    And the workspace already contains the question "Which country is the largest producer of coffee?" without a dedup embedding
    When I open Robin AI
    And I ask Robin:
      | Create exactly this question, verbatim:            |
      | "Which country is the largest producer of coffee?" |
    Then I see a Robin notice in the chat
    And the Robin composer is still available
