Feature: Workspace page management
  The workspace page is the central hub for managing questions and quizzes.
  From here, a quiz maker can:
  - Take, edit, or delete individual questions
  - View updated question text after edits
  Questions used in a quiz cannot be deleted.

  Scenario: Workspace summary shows zero questions and zero quizzes by default
    Given workspace "Workspace"
    Then I see workspace question count 0
    And I see workspace quiz count 0


  Scenario: Workspace summary shows one question after creating a question
    Given workspace "Workspace" with questions
      | question       | answers  |
      | What is 2 + 2? | 4 (*), 5 |
    Then I see workspace question count 1
    And I see workspace quiz count 0


  Scenario: Workspace summary shows two questions and one quiz
    Given workspace "Workspace" with questions
      | question       | answers  |
      | What is 2 + 2? | 4 (*), 5 |
      | What is 3 * 3? | 9 (*), 6 |
    And quiz "Math Quiz" with all questions
    Then I see workspace question count 2
    And I see workspace quiz count 1


  Scenario: Workspace summary updates after removing a question
    Given workspace "Workspace" with questions
      | question       | answers  |
      | What is 2 + 2? | 4 (*), 5 |
      | What is 3 * 3? | 9 (*), 6 |
    When I delete question "What is 2 + 2?" from the list
    Then I see workspace question count 1
    And I see workspace quiz count 0


  Scenario: Workspace summary updates after removing a quiz
    Given workspace "Workspace" with questions
      | question       | answers  |
      | What is 2 + 2? | 4 (*), 5 |
      | What is 3 * 3? | 9 (*), 6 |
    And quiz "Math Quiz" with all questions
    When I delete quiz "Math Quiz" from the workspace
    And I confirm the deletion
    Then I see workspace question count 2
    And I see workspace quiz count 0


  Scenario: Take question in a workspace
    Given workspace "Workspace" with questions
      | question  | answers  |
      | 2 + 2 = ? | 4 (*), 5 |
      | 3 * 3 = ? | 9 (*), 6 |
    When I take question "2 + 2 = ?" from the list
    Then I see the question and the answers


  Scenario: Delete question in a workspace
    Given workspace "Workspace" with questions
      | question  | answers  |
      | 2 + 2 = ? | 4 (*), 5 |
    When I delete question "2 + 2 = ?" from the list
    Then I see an empty workspace


  Scenario: Do not show delete button for question used in a quiz
    Given workspace "Workspace" with questions
      | question              | answers         |
      | Jaký nábytek má Ikea? | Stůl (*), Auto  |
      | Jaké nádobí má Ikea?  | Talíř (*), Kolo |
    When I start creating a new quiz
    And I enter quiz name "Math Quiz"
    And I select exam mode
    And I select question "Jaký nábytek má Ikea?"
    And I select question "Jaké nádobí má Ikea?"
    And I submit the quiz
    Then I see the quiz "Math Quiz" in the workspace
    Then I cannot delete question "Jaký nábytek má Ikea?"


  Scenario: Edit question in a workspace
    Given workspace "Workspace" with questions
      | question  | answers  |
      | 2 + 2 = ? | 4 (*), 5 |
      | 3 * 3 = ? | 9 (*), 6 |
    When I edit question "2 + 2 = ?" from the list
    Then I see question edit page
    And I see question text "2 + 2 = ?"


  Scenario: Show edited question in a workspace
    Given workspace "Workspace" with questions
      | question  | answers  |
      | 2 + 2 = ? | 4 (*), 5 |
      | 3 * 3 = ? | 9 (*), 6 |
    When I edit question "2 + 2 = ?" from the list
    Then I see question edit page
    And I enter question "A + B = ?"
    When I submit the question
    Then I see question in list "A + B = ?"


  Scenario: Question with image shows thumbnail in workspace
    Given workspace "Workspace" with questions
      | question              | answers      | image                               |
      | Which animal is this? | Cat (*), Dog | https://placekitten.com/300/200.jpg |
      | 2 + 2 = ?             | 4 (*), 5     |                                     |
    Then I see image thumbnail for question "Which animal is this?"
    And I do not see image thumbnail for question "2 + 2 = ?"


  Scenario: Filter questions in workspace
    Given workspace "Workspace" with questions
      | question                       | answers            |
      | 2 + 2 = ?                      | 4 (*), 5           |
      | Which animal is this?          | Cat (*), Dog       |
      | 3 * 3 = ?                      | 9 (*), 6           |
      | 4 / 2 = ?                      | 2 (*), 3           |
      | Jaký nábytek má Ikea?          | Stůl (*), Auto     |
      | Jaké má nádobí Ikea?           | Talíř (*), Kolo    |
      | Jaké nádobí má Ikea?           | Talíř (*), Kolo    |
      | Jaký venkovní Nábytek má Ikea? | Židle (*), Triangl |
    When I filter questions in workspace by "<filter>"
    Then I see quiz question "<visibleQuestion1>" in workspace
    And I see quiz question "<visibleQuestion2>" in workspace
    And I don't see quiz questions "<hiddenQuestion1>" in workspace
    And I don't see quiz questions "<hiddenQuestion2>" in workspace

    Examples:
      | filter    | visibleQuestion1      | visibleQuestion2               | hiddenQuestion1       | hiddenQuestion2                |
      | 2         | 2 + 2 = ?             | 4 / 2 = ?                      | 3 * 3 = ?             | Jaký nábytek má Ikea?          |
      | Ikea      | Jaký nábytek má Ikea? | Jaké nádobí má Ikea?           | 2 + 2 = ?             | 3 * 3 = ?                      |
      | nábytek   | Jaký nábytek má Ikea? | Jaký venkovní Nábytek má Ikea? | 2 + 2 = ?             | 4 / 2 = ?                      |
      | nábyt     | Jaký nábytek má Ikea? | Jaký venkovní Nábytek má Ikea? | 2 + 2 = ?             | 4 / 2 = ?                      |
      | má nádobí | Jaké má nádobí Ikea?  | Jaké nádobí má Ikea?           | 2 + 2 = ?             | 4 / 2 = ?                      |
      | má nád    | Jaké má nádobí Ikea?  | Jaké nádobí má Ikea?           | Jaký nábytek má Ikea? | Jaký venkovní Nábytek má Ikea? |


  Scenario: Filter questions in workspace by tag
    Given workspace "Workspace" with questions
      | question              | tag   | answers                              |
      | What is a Sprint?     | scrum | Time-boxed iteration (*), A ceremony |
      | Jaký nábytek má Ikea? | ikea  | Stůl (*), Auto                       |
      | What is a Backlog?    |       | Ordered list (*), Random list        |
    When I filter questions in workspace by "<tag>"
    Then I see quiz question "<question>" in workspace
    And I don't see quiz questions "<hiddenQuestion>" in workspace

    Examples:
      | tag   | question              | hiddenQuestion     |
      | scrum | What is a Sprint?     | What is a Backlog? |
      | zoo   |                       | What is a Sprint?  |
      | ikea  | Jaký nábytek má Ikea? | What is a Sprint?  |


  Scenario: Quiz filter section has the same label and input as question filter
    Given workspace "Workspace" with quizzes
      | quiz      |
      | Math Quiz |
    Then I see quiz filter label "Filter quizzes"


  Scenario: Filter quizzes in workspace
    Given workspace "Workspace" with quizzes
      | quiz        |
      | first quiz  |
      | second quiz |
      | third quiz  |
      | fourth quiz |
    When I filter quizzes in workspace by "<filter>"
    Then I see quiz "<visibleQuiz1>" in workspace
    And I see quiz "<visibleQuiz2>" in workspace
    And I don't see quiz "<hiddenQuiz1>" in workspace
    And I don't see quiz "<hiddenQuiz2>" in workspace

    Examples:
      | filter | visibleQuiz1 | visibleQuiz2 | hiddenQuiz1 | hiddenQuiz2 |
      | first  | first quiz   |              | second quiz | third quiz  |
      | th     | third quiz   | fourth quiz  | first quiz  | second quiz |
      | aaa    |              |              | first quiz  | second quiz |
      | t      | first quiz   | third quiz   | second quiz |             |
      | quiz   | first quiz   | second quiz  |             |             |


  Scenario Outline: Filter questions in workspace by selecting multiple tags
    Given workspace "Workspace" with questions
      | question                         | tag         | answers                              |
      | What is a Sprint?                | scrum       | Time-boxed iteration (*), A ceremony |
      | Jaký nábytek má Ikea?            | ikea        | Stůl (*), Auto                       |
      | What is sprint planning meeting? | scrum,agile | Team plans sprint (*), Team lunch    |
      | What is velocity?                | agile       | Measure of delivered work (*), Mood  |
      | What is a Backlog?               |             | Ordered list (*), Random list        |
    Then I see available question tags below the workspace question filter
      | scrum |
      | ikea  |
      | agile |
    When I select question tags in workspace
      | <selectedTag1> |
      | <selectedTag2> |
    Then I see quiz question "<visibleQuestion1>" in workspace
    And I see quiz question "<visibleQuestion2>" in workspace
    And I don't see quiz questions "<hiddenQuestion1>" in workspace
    And I don't see quiz questions "<hiddenQuestion2>" in workspace

    Examples:
      | selectedTag1 | selectedTag2 | visibleQuestion1                 | visibleQuestion2      | hiddenQuestion1       | hiddenQuestion2    |
      | scrum        | agile        | What is sprint planning meeting? | What is a Sprint?     | Jaký nábytek má Ikea? | What is a Backlog? |
      | scrum        | ikea         | What is a Sprint?                | Jaký nábytek má Ikea? | What is velocity?     | What is a Backlog? |
