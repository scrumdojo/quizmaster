Feature: Create question - single/multiple choice
  Single choice question has exactly one answer correct.
  Multiple choice question can have two or more answers correct.
  Switching between modes preserves or resets the selection depending
  on whether the current state is valid for the target mode.

  Background:
    Given I start creating a new question


  Scenario: Default is single choice
    Then the question is single choice


  Scenario: Single choice: Mark correct answer
    * I enter answers
      | Brno       |  |
      | Berlin     |  |
      | Bratislava |  |
    When I mark answer 2 as correct
    Then I see the answers fields
      | Brno       |   |
      | Berlin     | * |
      | Bratislava |   |


  Scenario: Single choice: Change correct answer
    * I enter answers
      | Brno       |   |
      | Berlin     | * |
      | Bratislava |   |
    When I mark answer 1 as correct
    Then I see the answers fields
      | Brno       | * |
      | Berlin     |   |
      | Bratislava |   |


  Scenario: Multiple choice: Mark multiple correct answers
    * I mark the question as multiple choice
    * I enter answers
      | Brno       |  |
      | Berlin     |  |
      | Bratislava |  |
    When I mark answer 2 as correct
    * I mark answer 3 as correct
    Then I see the answers fields
      | Brno       |   |
      | Berlin     | * |
      | Bratislava | * |


  Scenario: Switch single to multiple choice: Keep selection
    * I enter answers
      | Brno       |   |
      | Berlin     | * |
      | Bratislava |   |
    When I mark the question as multiple choice
    Then I see the answers fields
      | Brno       |   |
      | Berlin     | * |
      | Bratislava |   |


  Scenario: Switch multiple to single choice: Keep selection
    If exactly one answer is marked as correct for a multiple choice question,
    switching to single choice keeps the marked answer

    * I mark the question as multiple choice
    * I enter answers
      | Brno       |   |
      | Berlin     | * |
      | Bratislava |   |
    When I mark the question as multiple choice
    Then I see the answers fields
      | Brno       |   |
      | Berlin     | * |
      | Bratislava |   |


  Scenario: Switch multiple to single choice: Reset selection
    If more than one answer is marked as correct for a multiple choice question,
    switching to single choice unmarks all answers.

    * I mark the question as multiple choice
    * I enter answers
      | Brno       | * |
      | Berlin     | * |
      | Bratislava |   |
    When I mark the question as single choice
    Then I see the answers fields
      | Brno       |  |
      | Berlin     |  |
      | Bratislava |  |


  Scenario: Easy: Verify that Easy is visible only for Multiple Choice
    # default case (Single choice)
    Then the question is single choice
    And easy is not available

    When I mark the question as multiple choice
    Then easy is available
    And easy is off


  Scenario: Switch single choice to numerical
    * I enter question "How many regions does Czechia have?"
    * I enter answers
      | 13 |   |
      | 14 | * |
    When I mark the question as numerical
    Then the question is numerical
    And I see numerical answer field
    And I do not see answer fields
    And I do not see Add Answer button
    And easy is not available

    When I enter numerical correct answer "14"
    And I submit the question
    And I edit question "How many regions does Czechia have?" from the list
    Then I see question edit page
    And I see numerical correct answer "14"


  Scenario: Switch multiple choice to numerical
    * I mark the question as multiple choice
    * I enter question "How many regions does Czechia have?"
    * I enter answers
      | 13 | * |
      | 14 | * |
    When I mark the question as numerical
    Then the question is numerical
    And I see numerical answer field

    And I do not see answer fields
    And I do not see Add Answer button
    And easy is not available

    When I enter numerical correct answer "14"
    And I submit the question
    And I edit question "How many regions does Czechia have?" from the list
    Then I see question edit page
    And I see numerical correct answer "14"


  Scenario: Add tolerance to numerical question
    When I mark the question as numerical
    When I enter question "How many regions does Czechia have?"
    When I enter numerical correct answer "14"
    When I set tolerance to "3"
    When I submit the question
    And I edit question "How many regions does Czechia have?" from the list
    Then I see question edit page
    Then I see tolerance "3"


  Scenario: Create numerical question with decimal answer
    When I mark the question as numerical
    * I enter question "What is π to two decimal places?"
    * I enter numerical correct answer "3.14"
    * I submit the question
    * I edit question "What is π to two decimal places?" from the list
    Then I see question edit page
    And I see numerical correct answer "3.14"


  Scenario: Add decimal tolerance to numerical question
    When I mark the question as numerical
    * I enter question "What is π to two decimal places?"
    * I enter numerical correct answer "3.14"
    * I set tolerance to "0.5"
    * I submit the question
    * I edit question "What is π to two decimal places?" from the list
    Then I see question edit page
    And I see tolerance "0.5"


  Scenario: Create numerical question with 2 decimal digits
    When I mark the question as numerical
    * I enter question "What is π to two decimal places?"
    * I enter numerical correct answer "3.14"
    Then I see note "2 decimal digits will be required in the answer."


  Scenario: Edit numerical question with 2 decimal digits
    When I mark the question as numerical
    * I enter question "What is π to two decimal places?"
    * I enter numerical correct answer "3.14"
    * I submit the question
    * I edit question "What is π to two decimal places?" from the list
    Then I see question edit page
    And I see note "2 decimal digits will be required in the answer."


  Scenario: Modify number of decimal digits
    When I mark the question as numerical
    * I enter question "What is π to two decimal places?"
    * I enter numerical correct answer "3.14"
    * I submit the question
    * I edit question "What is π to two decimal places?" from the list
    * I enter numerical correct answer "3.1415"
    Then I see note "4 decimal digits will be required in the answer."
