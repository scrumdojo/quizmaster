Feature: Create Quiz from Workspace
  A quiz is created from the workspace by selecting questions, entering a
  name and description, and optionally enabling randomized question selection
  (finalCount) to limit how many questions are served from the pool.
  The question list can be filtered by keyword during selection.
  The created quiz appears in the workspace's quiz list.

  Scenario: Create quiz and display it in quiz list
    Given workspace "Quiz Creation" with questions
      | question                       | answers            |
      | 2 + 2 = ?                      | 4 (*), 5           |
      | 3 * 3 = ?                      | 9 (*), 6           |
      | 4 / 2 = ?                      | 2 (*), 3           |
      | Jaký nábytek má Ikea?          | Stůl (*), Auto     |
      | Jaké nádobí má Ikea?           | Talíř (*), Kolo    |
      | Jaký venkovní Nábytek má Ikea? | Židle (*), Triangl |
    When I start creating a new quiz
    * I enter quiz name "Math Quiz"
    * I enter quiz description "Very hard math quiz"
    * I select question "2 + 2 = ?"
    * I select question "4 / 2 = ?"
    * I submit the quiz
    Then I see the quiz "Math Quiz" in the workspace
    * I take quiz "Math Quiz"


  Scenario: Create quiz with randomized question pool
    Given workspace "Quiz Creation" with questions
      | question                       | answers            |
      | 2 + 2 = ?                      | 4 (*), 5           |
      | 3 * 3 = ?                      | 9 (*), 6           |
      | 4 / 2 = ?                      | 2 (*), 3           |
      | Jaký nábytek má Ikea?          | Stůl (*), Auto     |
      | Jaké nádobí má Ikea?           | Talíř (*), Kolo    |
      | Jaký venkovní Nábytek má Ikea? | Židle (*), Triangl |
    When I start creating a new quiz
    * I enter quiz name "Math Quiz"
    * I enter quiz description "Very hard math quiz"
    * I select question "2 + 2 = ?"
    * I select question "4 / 2 = ?"
    * I select question "Jaký nábytek má Ikea?"
    * I select question "Jaké nádobí má Ikea?"
    Then I see selected question count 4
    * I see total question count 6
    When I enable question randomization
    * I set randomized question count to 3
    * I submit the quiz
    * I take quiz "Math Quiz"
    Then I see the welcome page
    * I see quiz name "Math Quiz"
    * I see quiz description "Very hard math quiz"
    * I see question count 3


  Scenario Outline: Filter questions in quiz creation form
    Given workspace "Quiz Filter" with questions
      | question                       | answers            |
      | 2 + 2 = ?                      | 4 (*), 5           |
      | 3 * 3 = ?                      | 9 (*), 6           |
      | 4 / 2 = ?                      | 2 (*), 3           |
      | Jaký nábytek má Ikea?          | Stůl (*), Auto     |
      | Jaké má nádobí Ikea?           | Talíř (*), Kolo    |
      | Jaké nádobí má Ikea?           | Talíř (*), Kolo    |
      | Jaký venkovní Nábytek má Ikea? | Židle (*), Triangl |
    When I start creating a new quiz
    And I filter questions by "<filter>"
    Then I see quiz question "<visibleQuestion1>"
    And I see quiz question "<visibleQuestion2>"
    And I don't see quiz questions "<hiddenQuestion1>"
    And I don't see quiz questions "<hiddenQuestion2>"

    Examples:
      | filter    | visibleQuestion1      | visibleQuestion2               | hiddenQuestion1       | hiddenQuestion2                |
      | 2         | 2 + 2 = ?             | 4 / 2 = ?                      | 3 * 3 = ?             | Jaký nábytek má Ikea?          |
      | Ikea      | Jaký nábytek má Ikea? | Jaké nádobí má Ikea?           | 2 + 2 = ?             | 3 * 3 = ?                      |
      | nábytek   | Jaký nábytek má Ikea? | Jaký venkovní Nábytek má Ikea? | 2 + 2 = ?             | 4 / 2 = ?                      |
      | nábyt     | Jaký nábytek má Ikea? | Jaký venkovní Nábytek má Ikea? | 2 + 2 = ?             | 4 / 2 = ?                      |
      | má nádobí | Jaké má nádobí Ikea?  | Jaké nádobí má Ikea?           | 2 + 2 = ?             | 4 / 2 = ?                      |
      | má nád    | Jaké má nádobí Ikea?  | Jaké nádobí má Ikea?           | Jaký nábytek má Ikea? | Jaký venkovní Nábytek má Ikea? |


  Scenario: Filter questions in quiz creation by tag
    Given workspace "Tags" with questions
      | question           | tag   | answers                              |
      | What is a Sprint?  | scrum | Time-boxed iteration (*), A ceremony |
      | What is a Backlog? |       | Ordered list (*), Random list        |
    When I start creating a new quiz
    And I filter questions by "scrum"
    Then I see quiz question "What is a Sprint?"
    And I don't see quiz questions "What is a Backlog?"


  @skip
  Scenario: Quiz time limit formatting
    Given workspace "Testworkspace"
    When I start creating a new quiz
    And I see the quiz creation page
    Then form reacts correctly to all given inputs
      | timeLimit | formattedTimeLimit |
      | 10s       | 0h 0m 10s          |
      | 120s      | 0h 2m 0s           |
      | 170s      | 0h 2m 50s          |
      | 4182s     | 1h 9m 42s          |
      | 4m        | 0h 4m 0s           |
      | 4M        | 0h 4m 0s           |
      | 35m30s    | 0h 35m 30s         |
      | 100M90s   | 1h 41m 30s         |
      | 90S100m   | 1h 41m 30s         |
      |           | Not valid format   |


  Scenario Outline: Quiz start and end date
    Given workspace "Testquizdates" with questions
      | question  | answers  |
      | 2 + 2 = ? | 4 (*), 5 |
      | 3 * 3 = ? | 9 (*), 6 |
    When I start creating a new quiz
    * I enter quiz name "Math Quiz"
    * I enter quiz description "Very hard math quiz"
    * I select question "2 + 2 = ?"
    * I select question "3 * 3 = ?"
    * I set quiz availability start "<startDate>" and end "<endDate>"
    * I submit the quiz
    Then I see the quiz "Math Quiz" in the workspace

    Examples:
      | startDate        | endDate          |
      | 2026-04-14T10:00 | 2026-04-14T23:00 |
      | 2026-04-14T10:00 |                  |
      |                  | 2026-04-14T23:00 |


  Scenario: Create a new question from within the quiz form and continue editing
    Given workspace "Quiz Creation"
    When I start creating a new quiz
    And I click create new question in quiz form
    Then I see the inline question creation modal
    When I fill in the inline question "3 * 3 = ?" with answer "9"
    And I save the inline question
    Then I am back on the quiz creation form
    And I see question "3 * 3 = ?" in the quiz question list
