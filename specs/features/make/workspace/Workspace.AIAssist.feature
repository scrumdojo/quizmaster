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
    And I tell Robin AI "Uloz otazky"
    Then workspace question count increased by 1
    And I see question in list "What is the capital of Czech Republic?"
