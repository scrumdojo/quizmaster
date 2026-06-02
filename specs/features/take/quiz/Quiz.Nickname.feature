Feature: Quiz Nickname
  Before starting a quiz, user must set a nickname to be displayed on the leaderboard. This allows users to track their performance and compare with others.

  Scenario: User sets a nickname before starting the quiz
    Given workspace "Welcome" with questions
      | bookmark | question  | answers  |
      | Q1       | 1 + 1 = ? | 2 (*), 3 |
      | Q2       | 2 + 2 = ? | 4 (*), 5 |
      | Q3       | 3 + 3 = ? | 6 (*), 7 |
      | Q4       | 4 + 4 = ? | 8 (*), 9 |
    And quiz "Quiz A" with questions "Q1, Q2, Q3, Q4"
    And quiz "Quiz A" has finished individuals attempts
      | nickname | correct |
      | Alice    | 4       |
      | Bob      | 3       |
      | Charlie  | 2       |
    When I open quiz "Quiz A"
    Then I see the welcome page
    When I continue to Nickname page
    Then I see the nickname input field
    When I enter "Dave" as nickname
    And I start the quiz
    Then I see question "Q1"
