Feature: Poll form validations
  Validation rules for the poll form:
  - Poll question is required
  - Every answer field must be filled in
  A poll failing validation is not saved.

  Background:
    Given workspace "Poll Validations"


  Scenario: Empty poll form
    When I start creating a new poll
    And I attempt to submit the poll
    Then I see poll error messages
      | empty-question |
      | empty-answer   |


  Scenario: Empty poll question
    When I start creating a new poll
    * I enter poll answers
      | Weekly  |
      | Monthly |
    And I attempt to submit the poll
    Then I see poll error messages
      | empty-question |


  Scenario: All poll answers must be filled in
    When I start creating a new poll
    * I enter poll question "How often do you run retrospectives?"
    * I enter poll answer 1 text "Weekly"
    And I attempt to submit the poll
    Then I see poll error messages
      | empty-answer |


  Scenario: Fixing the errors lets the poll be saved
    When I start creating a new poll
    And I attempt to submit the poll
    Then I see poll error messages
      | empty-question |
      | empty-answer   |
    When I enter poll question "How often do you run retrospectives?"
    * I enter poll answers
      | Weekly  |
      | Monthly |
    * I submit the poll
    Then I see poll "How often do you run retrospectives?" in the list
