Feature: Workspace question order
  Questions in the workspace are shown newest first so a maker
  always sees their most recent work at the top.

  Scenario: Questions are ordered newest first
    Given workspace "Ordering" with questions
      | question        | answers  |
      | First Question  | A (*), B |
      | Second Question | A (*), B |
      | Third Question  | A (*), B |
    When I open the workspace
    Then I see questions in order: "Third Question", "Second Question", "First Question"


  Scenario: Questions show their order number
    Given workspace "Ordering" with questions
      | question        | answers  |
      | First Question  | A (*), B |
      | Second Question | A (*), B |
    When I open the workspace
    Then I see question "Second Question" with order number 1
    And I see question "First Question" with order number 2


  Scenario: Question order numbers continue across pages
    Given workspace "Ordering" with 11 questions
    When I open the workspace
    And I go to question page 2
    Then I see question "Question 1" with order number 11
