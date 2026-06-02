Feature: Generate question using AI
  Robin AI drafts a question in chat from a topic. The quiz maker reviews
  the draft and uses it to fill the question form before saving.

  Scenario: Create question Robin AI uses the chat composer docked at the bottom
    Given I start creating a new question
    When I open Robin AI
    Then Robin AI message composer is docked to the bottom of the chat


  Scenario: Create question Robin AI does not show a Generate button
    Given I start creating a new question
    When I open Robin AI
    Then I do not see Robin AI send button


  Scenario: Using a generated question fills the form and closes the assistant
    Given I start creating a new question
    And Robin AI will return these generated questions:
      | question                               | answers                  |
      | What is the capital of Czech Republic? | Prague (*), Brno, Berlin |
    When I open Robin AI
    And I ask AI:
      | Generate a question about capital cities |
    And I use the generated question
    Then I see question text "What is the capital of Czech Republic?"
    And the question is single choice
    And I see at least 3 answers
    And exactly 1 answer is marked correct
    And I do not see AI section


  @ai
  Scenario: AI-generated question shows explanations
    Given I start creating a new question
    When I open Robin AI
    And I ask AI:
      | Generate a question about nuclear physics |
    And I use the generated question
    Then Question field is not empty
    And I see explanations are enabled
    And all answers have explanations


  @ai
  Scenario: Generate a single-choice question
    Given I start creating a new question
    When I open Robin AI
    And I ask AI:
      | Generate a question about capital cities |
      | and 2 incorrect answers                  |
    Then I see generated question 1 in Robin chat
    And generated question 1 in Robin chat has at least 3 answers
    And generated question 1 in Robin chat has 1 highlighted correct answers


  @ai
  Scenario: Generate a multiple-choice question
    Given I start creating a new question
    When I open Robin AI
    And I ask AI for multiple choice question:
      | Generate a question about European capitals |
      | and 2 incorrect answers                     |
    Then I see generated question 1 in Robin chat
    And generated question 1 in Robin chat has at least 4 answers
    And generated question 1 in Robin chat has at least 2 highlighted correct answers


  @ai
  Scenario: Do not generate a question that duplicates an existing workspace question
    Given I start creating a new question
    And the workspace already contains the question "Which country is the largest producer of coffee?"
    When I ask the application to create a exact question "Which country is the largest producer of coffee?"
    Then the generated question in Robin chat should not ask "Which country is the largest producer of coffee?"


  @ai
  Scenario: Save an AI-generated question
    Given I start creating a new question
    When I open Robin AI
    And I ask AI:
      | Generate a question about capital cities |
      | with 1 correct answer                    |
      | and 2 incorrect answers                  |
    And I use the generated question
    And I submit the question
    Then the question is saved in the workspace


  @ai
  Scenario: Edit an AI-generated question before saving
    Given I start creating a new question
    When I open Robin AI
    And I ask AI:
      | Generate a question about capital cities |
      | with 1 correct answer                    |
      | and 2 incorrect answers                  |
    And I use the generated question
    And I enter question "What is the capital of France?"
    And I submit the question
    Then I see question in list "What is the capital of France?"


  @ai
  Scenario: Regenerate replaces the previous AI draft
    Given I start creating a new question
    When I open Robin AI
    And I ask AI:
      | Generate a question about capital cities |
      | and 2 incorrect answers                  |
    Then generated question 1 in Robin chat has 1 highlighted correct answers
    When I ask AI for multiple choice question:
      | Generate a question about European capitals |
      | with 2 correct answers                      |
      | and 2 incorrect answers                     |
    Then I see 1 generated questions in Robin chat
    And generated question 1 in Robin chat has at least 2 highlighted correct answers


  Scenario: AI section is available when editing
    Given question "What is the capital of Czech Republic?"
    * with answers:
      | Brno   |   | No Brno |
      | Prague | * | Yes     |
      | Berlin |   | Germany |
    * saved and bookmarked as "Czechia"
    When I start editing question "Czechia"
    * I open Robin AI
    Then I see AI section


  Scenario: AI updates an edited question from current form context
    Given question "What is the capital of Czech Republic?"
    * with answers:
      | Brno   |   | No Brno |
      | Prague | * | Yes     |
      | Berlin |   | Germany |
    * saved and bookmarked as "Czechia"
    When I start editing question "Czechia"
    * I open Robin AI
    * I ask stubbed AI to "add two more incorrect answers"
    Then AI received current question context
    * I use the generated question
    * I see the answers fields
      | Brno       |   | No Brno |
      | Prague     | * | Yes     |
      | Berlin     |   | Germany |
      | Ostrava    |   | No      |
      | Bratislava |   | No      |


  Scenario: AI edit is discarded when not submitted
    Given question "What is the capital of Czech Republic?"
    * with answers:
      | Brno   |   | No Brno |
      | Prague | * | Yes     |
      | Berlin |   | Germany |
    * saved and bookmarked as "Czechia"
    When I start editing question "Czechia"
    * I open Robin AI
    * I ask stubbed AI to "add two more incorrect answers"
    * I use the generated question
    * I refresh the page
    * I start editing question "Czechia"
    Then I see the answers fields
      | Brno   |   | No Brno |
      | Prague | * | Yes     |
      | Berlin |   | Germany |


  Scenario: AI context includes unsaved manual edits
    Given question "What is the capital of Czech Republic?"
    * with answers:
      | Brno   |   | No Brno |
      | Prague | * | Yes     |
      | Berlin |   | Germany |
    * saved and bookmarked as "Czechia"
    When I start editing question "Czechia"
    * I enter question "What is the capital of Slovakia?"
    * I enter answer 2 text "Bratislava"
    * I open Robin AI
    * I ask stubbed AI to "add one more incorrect answer"
    Then AI received current question context with question "What is the capital of Slovakia?"
    * AI received current question context with answer "Bratislava"
