Feature: Quiz scheduling
  Before a user starts a quiz, the app checks whether the quiz is within its configured availability window.
  If the quiz is unavailable, the Start button is disabled and shown in a grayed-out state.

  @skip
  Scenario: Quiz is available during the scheduled period
    Given workspace "Welcome" with questions
      | bookmark | question  | answers  |
      | Q1       | 1 + 1 = ? | 2 (*), 3 |
      | Q2       | 2 + 2 = ? | 4 (*), 5 |
    And quiz "Quiz" with questions "Q1, Q2"
      | description | Description A |
      | mode        | exam          |
      | pass score  | 66            |
      | time limit  | 120s          |
      | start date  | today - 1     |
      | end date    | today + 1     |
    When I open quiz "Quiz"
    Then I see the welcome page
    * I can start the quiz
    * I see status message "Enjoy the quiz"
    * I see status message "Quiz ends at {end date}"


  @skip
  Scenario: Quiz is unavailable before the scheduled period starts
    Given workspace "Welcome" with questions
      | bookmark | question  | answers  |
      | Q1       | 1 + 1 = ? | 2 (*), 3 |
      | Q2       | 2 + 2 = ? | 4 (*), 5 |
    And quiz "Quiz" with questions "Q1, Q2"
      | description | Description B |
      | mode        | exam          |
      | pass score  | 66            |
      | time limit  | 120s          |
      | start date  | today + 1     |
      | end date    | today + 2     |
    When I open quiz "Quiz"
    Then I see the welcome page
    * I cannot start the quiz
    * I see status message "It's too early!"
    * I see status message "Quiz starts at {start date}"


  @skip
  Scenario: Quiz is unavailable after the scheduled period starts
    Given workspace "Welcome" with questions
      | bookmark | question  | answers  |
      | Q1       | 1 + 1 = ? | 2 (*), 3 |
      | Q2       | 2 + 2 = ? | 4 (*), 5 |
    And quiz "Quiz" with questions "Q1, Q2"
      | description | Description B |
      | mode        | exam          |
      | pass score  | 66            |
      | time limit  | 120s          |
      | start date  | today - 3     |
      | end date    | today - 2     |
    When I open quiz "Quiz"
    Then I see the welcome page
    * I cannot start the quiz
    * I see status message "It's too late!"
    * I see status message "Quiz ended at {end date}."


  @skip
  Scenario: Quiz is available without scheduled period.
    Given workspace "Welcome" with questions
      | bookmark | question  | answers  |
      | Q1       | 1 + 1 = ? | 2 (*), 3 |
      | Q2       | 2 + 2 = ? | 4 (*), 5 |
    And quiz "Quiz" with questions "Q1, Q2"
      | description | Description B |
      | mode        | exam          |
      | pass score  | 66            |
      | time limit  | 120s          |
    When I open quiz "Quiz"
    Then I see the welcome page
    * I cannot start the quiz
    * I see status message "Enjoy the quiz! You can start anytime"


  Scenario: Direct questions route redirects to welcome page before the scheduled period starts
    Given workspace "Welcome" with questions
      | bookmark | question  | answers  |
      | Q1       | 1 + 1 = ? | 2 (*), 3 |
      | Q2       | 2 + 2 = ? | 4 (*), 5 |
    And quiz "Quiz" with questions "Q1, Q2"
      | description | Description C |
      | mode        | exam          |
      | pass score  | 66            |
      | time limit  | 120s          |
      | start date  | today + 1     |
      | end date    | today + 2     |
    When I open quiz questions for "Quiz"
    Then I see the welcome page
    * I cannot start the quiz
