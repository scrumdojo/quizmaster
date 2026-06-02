Feature: Show generated questions in workspace Robin AI chat
  Robin AI shows generated questions directly in the workspace chat before
  they are created in the workspace. The quiz maker can review the generated
  questions, their answers, and which answers are correct.

  Scenario: Robin AI chat composer is docked at the bottom of the chat
    Given workspace "Workspace"
    When I open Robin AI
    Then Robin AI message composer is docked to the bottom of the chat


  Scenario: Robin AI chat does not show a Generate button
    Given workspace "Workspace"
    When I open Robin AI
    Then I do not see Robin AI send button


  Scenario: Pressing Enter sends a Robin AI message from the workspace chat
    Given workspace "Workspace"
    And Robin AI will return these generated questions:
      | question                               | answers                  |
      | What is the capital of Czech Republic? | Prague (*), Brno, Berlin |
      | What is the capital of France?         | Paris (*), Lyon, Nice    |
    When I open Robin AI
    And I enter Robin AI message "Vytvor 2 otazky na tema hlavni mesta v Evrope"
    And I press Enter to send the Robin AI message
    Then I see AI section
    And I see 2 generated questions in Robin chat
    And I do not see Robin AI send button


  Scenario: Robin AI clears the chat composer after sending a message
    Given workspace "Workspace"
    And Robin AI will return these generated questions:
      | question                               | answers                  |
      | What is the capital of Czech Republic? | Prague (*), Brno, Berlin |
      | What is the capital of France?         | Paris (*), Lyon, Nice    |
    When I open Robin AI
    And I enter Robin AI message "Vytvor 2 otazky na tema hlavni mesta v Evrope"
    And I press Enter to send the Robin AI message
    Then Robin AI message composer is empty
    And I see 2 generated questions in Robin chat


  Scenario: Robin AI confirms saving generated questions and clears the previews
    Given workspace "Workspace"
    And Robin AI will return these generated questions:
      | question                               | answers                  |
      | What is the capital of Czech Republic? | Prague (*), Brno, Berlin |
      | What is the capital of France?         | Paris (*), Lyon, Nice    |
    When I remember workspace question count
    And I open Robin AI
    And I enter Robin AI message "Vytvor 2 otazky na tema hlavni mesta v Evrope"
    And I press Enter to send the Robin AI message
    And I tell Robin AI "Uloz to"
    Then Robin AI message composer is empty
    And I see Robin AI chat message "Saved 2 questions to workspace."
    And I do not see generated questions in Robin chat
    And workspace question count increased by 2


  @ai
  Scenario: Robin shows generated questions in the workspace chat
    Given workspace "Workspace"
    And Robin AI will return these generated questions:
      | question                               | answers                              |
      | What is the capital of Czech Republic? | Prague (*), Brno, Berlin             |
      | Which of these are European capitals?  | Prague (*), Paris (*), Brno, Ostrava |
    When I open Robin AI
    And I ask AI to generate multiple questions:
      | Generate 2 questions about capital cities |
      | each with 1 or more correct answers       |
      | and 2 incorrect answers                   |
    Then I see AI section
    And I see 2 generated questions in Robin chat
    And I see workspace question count 0
    And I do not see question "What is the capital of Czech Republic?" in the list
    And I do not see question "Which of these are European capitals?" in the list


  @ai
  Scenario: Generated questions are numbered in Robin chat
    Given workspace "Workspace"
    And Robin AI will return these generated questions:
      | question                               | answers                  |
      | What is the capital of Czech Republic? | Prague (*), Brno, Berlin |
      | What is the capital of France?         | Paris (*), Lyon, Nice    |
    When I open Robin AI
    And I ask AI to generate multiple questions:
      | Generate 2 questions about capital cities |
      | each with 1 correct answer                |
      | and 2 incorrect answers                   |
    Then I see generated question 1 in Robin chat
    And generated question 1 in Robin chat is "What is the capital of Czech Republic?"
    And I see generated question 2 in Robin chat
    And generated question 2 in Robin chat is "What is the capital of France?"
    And I see workspace question count 0
    And I do not see question "What is the capital of Czech Republic?" in the list
    And I do not see question "What is the capital of France?" in the list


  @ai
  Scenario: Robin shows answers and highlights correct ones for generated questions
    Given workspace "Workspace"
    And Robin AI will return these generated questions:
      | question                               | answers                              |
      | What is the capital of Czech Republic? | Prague (*), Brno, Berlin             |
      | Which of these are European capitals?  | Prague (*), Paris (*), Brno, Ostrava |
    When I open Robin AI
    And I ask AI to generate multiple questions:
      | Generate 2 questions about capital cities |
      | each with 1 or more correct answers       |
      | and 2 incorrect answers                   |
    Then I see these answers for generated question 1 in Robin chat:
      | Prague | * |  |
      | Brno   |   |  |
      | Berlin |   |  |
    And generated question 1 in Robin chat has 3 answers
    And generated question 1 in Robin chat has 1 highlighted correct answers
    And I see these answers for generated question 2 in Robin chat:
      | Prague  | * |  |
      | Paris   | * |  |
      | Brno    |   |  |
      | Ostrava |   |  |
    And generated question 2 in Robin chat has 4 answers
    And generated question 2 in Robin chat has 2 highlighted correct answers
    And I see workspace question count 0
    And I do not see question "What is the capital of Czech Republic?" in the list
    And I do not see question "Which of these are European capitals?" in the list
