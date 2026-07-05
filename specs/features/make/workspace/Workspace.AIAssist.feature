Feature: Generate question preview from workspace using AI
  Robin AI is available directly on the workspace page, so a quiz maker
  can generate a question preview without opening the question form first.
  Generated questions stay in Robin chat until the quiz maker confirms them.

  @ai
  Scenario: Open Robin AI from workspace
    Given workspace "Workspace"
    When I open Robin AI
    Then I see AI section


  @ai
  Scenario: Generate a single-choice question preview directly in workspace
    Given workspace "Workspace"
    And Robin AI will return these generated questions:
      | question                               | answers                  |
      | What is the capital of Czech Republic? | Prague (*), Brno, Berlin |
    When I open Robin AI
    And I ask AI:
      | Generate a question about capital cities |
      | with 1 correct answer                    |
      | and 2 incorrect answers                  |
    Then I see the workspace "Workspace"
    And I see AI section
    And I see workspace question count 0
    And I do not see question "What is the capital of Czech Republic?" in the list
    And I see generated question 1 in Robin chat


  @ai
  Scenario: Generate a multiple-choice question preview directly in workspace
    Given workspace "Workspace"
    And Robin AI will return these generated questions:
      | question                              | answers                              |
      | Which of these are European capitals? | Prague (*), Paris (*), Brno, Ostrava |
    When I open Robin AI
    And I ask AI for multiple choice question:
      | Generate a question about European capitals |
      | with 2 correct answers                      |
      | and 2 incorrect answers                     |
    Then I see the workspace "Workspace"
    And I see AI section
    And I see workspace question count 0
    And I do not see question "Which of these are European capitals?" in the list
    And I see generated question 1 in Robin chat


  @ai
  Scenario: Repeated generation from workspace keeps the workspace unchanged until confirmation
    Given workspace "Workspace"
    And Robin AI will return these generated questions:
      | question                               | answers                              |
      | What is the capital of Czech Republic? | Prague (*), Brno, Berlin             |
      | Which of these are European capitals?  | Prague (*), Paris (*), Brno, Ostrava |
    When I open Robin AI
    And I ask AI:
      | Generate a question about capital cities |
      | with 1 correct answer                    |
      | and 2 incorrect answers                  |
    Then I see AI section
    And I see workspace question count 0
    When I ask AI for multiple choice question:
      | Generate a question about European capitals |
      | with 2 correct answers                      |
      | and 2 incorrect answers                     |
    Then I see AI section
    And I see workspace question count 0
    And I do not see question "What is the capital of Czech Republic?" in the list
    And I do not see question "Which of these are European capitals?" in the list


  @ai
  Scenario: Asking Robin in chat to save a generated question saves it to the workspace
    Given workspace "Workspace"
    And Robin AI will return these generated questions:
      | question                               | answers                  |
      | What is the capital of Czech Republic? | Prague (*), Brno, Berlin |
    When I remember workspace question count
    And I open Robin AI
    And I ask AI:
      | Generate a question about capital cities |
      | with 1 correct answer                    |
      | and 2 incorrect answers                  |
    And I save the generated questions
    Then workspace question count increased by 1
    And I see question in list "What is the capital of Czech Republic?"


  @skip @ai
  Scenario: Workspace Robin saves a single draft
    Given workspace "Workspace"
    When I remember workspace question count
    And I open Robin AI
    And I ask Robin:
      | Ask 2 questions about Czech geography |
    Then I see 2 generated questions in Robin chat
    When I save generated question 1
    Then workspace question count increased by 1


  @skip @ai
  Scenario: Save all persists every draft
    Given workspace "Workspace"
    When I remember workspace question count
    And I open Robin AI
    And I ask Robin:
      | Ask 2 questions about Czech geography |
    Then I see 2 generated questions in Robin chat
    When I save all generated questions
    Then workspace question count increased by 2


  @skip @ai
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


  @skip @ai
  Scenario: Robin shows per-answer and per-question explanations
    Given workspace "Workspace"
    When I open Robin AI
    And I ask Robin:
      | Ask one single-choice question about nuclear physics |
      | and explain each answer and the question itself      |
    Then generated question 1 in Robin chat shows question explanation
    And every answer of generated question 1 in Robin chat shows an explanation


  @skip @ai
  Scenario: Robin refuses a duplicate with a chat message and lets the maker continue
    Given workspace "Workspace"
    And the workspace already contains the question "Which country is the largest producer of coffee?" without a dedup embedding
    When I open Robin AI
    And I ask Robin:
      | Create exactly this question, verbatim:            |
      | "Which country is the largest producer of coffee?" |
    Then I see a Robin notice in the chat
    And the Robin composer is still available
