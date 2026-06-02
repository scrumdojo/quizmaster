Feature: Quiz creation requires at least 2 questions
  Clicking the Create quiz button when fewer than 2 questions exist
  shows an info message and keeps the maker on the workspace instead
  of opening the empty quiz form.

  Scenario: Cannot create a quiz with no questions
    Given workspace "Guard"
    When I open the workspace
    And I click the quiz create button
    Then I see the message "It's not possible to create quiz without min 2 questions exist"


  Scenario: Cannot create a quiz with only one question
    Given workspace "Guard" with questions
      | question  | answers  |
      | 2 + 2 = ? | 4 (*), 5 |
    When I open the workspace
    And I click the quiz create button
    Then I see the message "It's not possible to create quiz without min 2 questions exist"


  @skip
  Scenario: Can create a quiz when 2 or more questions exist
    Given workspace "Guard" with questions
      | question  | answers  |
      | 2 + 2 = ? | 4 (*), 5 |
      | 3 * 3 = ? | 9 (*), 6 |
    When I open the workspace
    And I start creating a new quiz
    Then I see the workspace "Guard"
