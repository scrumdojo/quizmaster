Feature: Generate question using AI
  Robin AI can generate question drafts from a topic and prefill the
  question form before the question is saved.

  Scenario: Create question Robin AI shows a Generate button
    Given I start creating a new question
    When I open Robin AI
    Then I see Robin AI send button


  Scenario: Create question Robin AI does not use the workspace chat composer
    Given I start creating a new question
    When I open Robin AI
    Then I do not see Robin AI message composer


  @ai
  Scenario: AI-generated question shows explanations
    Given I start creating a new question
    When I open Robin AI
    And I ask AI:
      | Generate a question about nuclear physics |
    Then Question field is not empty
    And I see explanations are enabled
    And all answers have explanations


  @ai
  Scenario: Generate a single-choice question
    Given I start creating a new question
    And the question is single choice
    When I open Robin AI
    And I ask AI:
      | Generate a question about capital cities |
      | and 2 incorrect answers                  |
    Then Question field is not empty
    And the question is single choice
    And I see at least 3 answers
    And exactly 1 answer is marked correct


  @ai
  Scenario: Generate a multiple-choice question
    Given I start creating a new question
    When I open Robin AI
    And I ask AI for multiple choice question:
      | Generate a question about European capitals |
      | and 2 incorrect answers                     |
    Then Question field is not empty
    And the question is multiple choice
    And I see at least 4 answers
    And at least 2 answers are marked correct


  @ai
  Scenario: Do not generate a question that duplicates an existing workspace question
    Given I start creating a new question
    And the workspace already contains the question "Which country is the largest producer of coffee?"
    When I ask the application to create a exact question "Which country is the largest producer of coffee?"
    Then the generated question should not ask "Which country is the largest producer of coffee?"


  @ai
  Scenario: Save an AI-generated question
    Given I start creating a new question
    When I open Robin AI
    And I ask AI:
      | Generate a question about capital cities |
      | with 1 correct answer                    |
      | and 2 incorrect answers                  |
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
    And I enter question "What is the capital of France?"
    And I submit the question
    Then I see question in list "What is the capital of France?"


  @ai
  Scenario: Regenerate replaces previous AI response
    Given I start creating a new question
    And the question is single choice
    When I open Robin AI
    And I ask AI:
      | Generate a question about capital cities |
      | and 2 incorrect answers                  |
    Then the question is single choice
    When I open Robin AI
    And I ask AI for multiple choice question:
      | Generate a question about European capitals |
      | with 2 correct answers                      |
      | and 2 incorrect answers                     |
    Then the question is multiple choice
    And at least 2 answers are marked correct


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
