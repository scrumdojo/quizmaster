Feature: Generate multiple question previews from workspace using AI
  Robin AI can create more than one question preview from a single workspace prompt.
  Generated questions stay in Robin chat until the quiz maker confirms them.
  Batch generation must work regardless of the language used in the prompt.

  @ai
  Scenario: Batch generation keeps Robin AI open after generation
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
    Then I see the workspace "Workspace"
    And I see AI section
    And I see 2 generated questions in Robin chat
    And I see workspace question count 0
    And I do not see question "What is the capital of Czech Republic?" in the list
    And I do not see question "What is the capital of France?" in the list


  @ai
  Scenario: Generate two single-choice questions in Robin chat directly in workspace
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
    Then I see AI section
    And I see 2 generated questions in Robin chat
    And I see workspace question count 0
    And I do not see question "What is the capital of Czech Republic?" in the list
    And I do not see question "What is the capital of France?" in the list


  @ai
  Scenario: A one-line Czech prompt asking for multiple questions generates multiple previews
    Given workspace "Workspace"
    And Robin AI will return these generated questions:
      | question                               | answers                  |
      | What is the capital of Czech Republic? | Prague (*), Brno, Berlin |
      | What is the capital of France?         | Paris (*), Lyon, Nice    |
    When I open Robin AI
    And I ask AI to generate multiple questions:
      | Vytvor 2 otazky na tema hlavni mesta v Evrope |
    Then I see AI section
    And I see 2 generated questions in Robin chat
    And I see workspace question count 0
    And I do not see question "What is the capital of Czech Republic?" in the list
    And I do not see question "What is the capital of France?" in the list


  @ai
  Scenario: Generate two multiple-choice questions in Robin chat directly in workspace
    Given workspace "Workspace"
    And Robin AI will return these generated questions:
      | question                              | answers                                |
      | Which of these are European capitals? | Prague (*), Paris (*), Brno, Ostrava   |
      | Which of these are Nordic capitals?   | Oslo (*), Stockholm (*), Bergen, Malmo |
    When I open Robin AI
    And I ask AI for multiple choice questions:
      | Generate 2 questions about European capitals |
      | each with 2 correct answers                  |
      | and 2 incorrect answers                      |
    Then I see AI section
    And I see 2 generated questions in Robin chat
    And I see workspace question count 0
    And I do not see question "Which of these are European capitals?" in the list
    And I do not see question "Which of these are Nordic capitals?" in the list


  @ai
  Scenario: Batch generation does not append questions to the existing workspace until confirmed
    Given workspace "Workspace" with questions
      | question  | answers  |
      | 2 + 2 = ? | 4 (*), 5 |
    And Robin AI will return these generated questions:
      | question                               | answers                  |
      | What is the capital of Czech Republic? | Prague (*), Brno, Berlin |
      | What is the capital of France?         | Paris (*), Lyon, Nice    |
    When I open Robin AI
    And I ask AI to generate multiple questions:
      | Generate 2 questions about capital cities |
      | each with 1 correct answer                |
      | and 2 incorrect answers                   |
    Then I see AI section
    And I see 2 generated questions in Robin chat
    And I see workspace question count 1
    And I do not see question "What is the capital of Czech Republic?" in the list
    And I do not see question "What is the capital of France?" in the list


  @ai
  Scenario: Saving generated questions from a non-English prompt saves all of them
    Given workspace "Workspace"
    And Robin AI will return these generated questions:
      | question                               | answers                  |
      | What is the capital of Czech Republic? | Prague (*), Brno, Berlin |
      | What is the capital of France?         | Paris (*), Lyon, Nice    |
    When I remember workspace question count
    And I open Robin AI
    And I ask AI to generate multiple questions:
      | Vygeneruj 2 otazky o hlavnych mestach |
      | kazda ma 1 spravnu odpoved            |
      | a 2 nespravne odpovede                |
    And I save the generated questions
    Then workspace question count increased by 2
    And I see question in list "What is the capital of Czech Republic?"
    And I see question in list "What is the capital of France?"


  @ai
  Scenario Outline: Generate two single-choice questions from one non-English prompt into Robin chat directly in workspace
    Given workspace "Workspace"
    And Robin AI will return these generated questions:
      | question                               | answers                  |
      | What is the capital of Czech Republic? | Prague (*), Brno, Berlin |
      | What is the capital of France?         | Paris (*), Lyon, Nice    |
    When I open Robin AI
    And I ask AI to generate multiple questions:
      | <line-1> |
      | <line-2> |
      | <line-3> |
    Then I see AI section
    And I see 2 generated questions in Robin chat
    And I see workspace question count 0
    And I do not see question "What is the capital of Czech Republic?" in the list
    And I do not see question "What is the capital of France?" in the list

    Examples:
      | line-1                                | line-2                      | line-3                 |
      | Vygeneruj 2 otazky o hlavnych mestach | kazda ma 1 spravnu odpoved  | a 2 nespravne odpovede |
      | Vygeneruj 2 otázky o hlavních městech | každá má 1 správnou odpověď | a 2 nesprávné odpovědi |


  @ai
  Scenario Outline: Generate two multiple-choice questions from one non-English prompt into Robin chat directly in workspace
    Given workspace "Workspace"
    And Robin AI will return these generated questions:
      | question                              | answers                                |
      | Which of these are European capitals? | Prague (*), Paris (*), Brno, Ostrava   |
      | Which of these are Nordic capitals?   | Oslo (*), Stockholm (*), Bergen, Malmo |
    When I open Robin AI
    And I ask AI for multiple choice questions:
      | <line-1> |
      | <line-2> |
      | <line-3> |
    Then I see AI section
    And I see 2 generated questions in Robin chat
    And I see workspace question count 0
    And I do not see question "Which of these are European capitals?" in the list
    And I do not see question "Which of these are Nordic capitals?" in the list

    Examples:
      | line-1                                           | line-2                      | line-3                 |
      | Vygeneruj 2 otazky o europskych hlavnych mestach | kazda ma 2 spravne odpovede | a 2 nespravne odpovede |
      | Vygeneruj 2 otázky o evropských hlavních městech | každá má 2 správné odpovědi | a 2 nesprávné odpovědi |
