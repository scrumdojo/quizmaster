Feature: Take a numerical question
  Numerical questions accept a typed number rather than choices. The user
  enters a value, submits, and gets immediate correct/incorrect feedback.
  An optional tolerance widens the accepted range around the correct answer.
  The user can retake the same question by entering a different value.

  Scenario: Without tolerance, only the exact answer is accepted
    Given question "What is 7 × 8?"
    * with numerical answer "56"
    * saved and bookmarked as "multiplication"
    When I take question "multiplication"
    And I retake with answers:
      | answer | feedback   |
      | 55     | Incorrect! |
      | 56     | Correct!   |
      | 57     | Incorrect! |


  Scenario: Tolerance widens the accepted range, boundaries inclusive
    Given question "Value of π to two decimal places?"
    * with numerical answer "3.14"
    * with tolerance "0.01"
    * saved and bookmarked as "pi"
    When I take question "pi"
    And I retake with answers:
      | answer | feedback   |
      | 3.12   | Incorrect! |
      | 3.13   | Correct!   |
      | 3.14   | Correct!   |
      | 3.15   | Correct!   |
      | 3.16   | Incorrect! |


  Scenario: Quiz question shows required decimal digits hint
    Given question "Value of π to two decimal places?"
    * with numerical answer "3.14"
    * saved and bookmarked as "pi"
    When I take question "pi"
    Then I see hint to enter answer with 2 decimal digits


  Scenario: Quiz question does not show decimal digits hint
    Given question "What is 7 × 8?"
    * with numerical answer "56"
    * saved and bookmarked as "multiplication"
    When I take question "multiplication"
    Then I do not see a decimal digits hint
