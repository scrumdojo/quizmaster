Feature: Create question - validations
  Validation rules for question creation:
  - Question text is required
  - Answer text for each answer is required
  - At least one correct answer is required (single choice: exactly one, multiple choice: at least two)
  - Answer explanations: either all or none
  - Question explanation is optional

  Scenario: Empty question form
    Given I start creating a new question
    When I attempt to submit the question
    Then I see error messages
      | empty-question    |
      | empty-answer      |
      | no-correct-answer |


  Scenario: Empty question text
    Given I start creating a new question
    * I enter answer 1 text "4" and mark it as correct
    * I enter answer 2 text "5"
    When I attempt to submit the question
    Then I see error messages
      | empty-question |


  Scenario: All answers must be filled in
    For single-choice question, exactly one correct answer is required

    Given I start creating a new question
    * I enter question "What is 2 + 2?"
    * I enter answer 1 text "4"
    * I mark answer 1 as correct
    When I attempt to submit the question
    Then I see error messages
      | empty-answer |


  Scenario: Add an empty answer
    Given I start creating a new question
    * I enter question "What is 2 + 2?"
    * I enter answer 1 text "4" and mark it as correct
    * I enter answer 2 text "5"
    * I add another answer
    When I attempt to submit the question
    Then I see error messages
      | empty-answer |


  Scenario: Answer explanations missing
    Either all or no answer explanations are required

    Given I start creating a new question
    * I enter question "What is 2 + 2?"
    * I enable explanations
    * I enter answer 1 text "4" and mark it as correct
    * I enter answer 1 explanation "4 is the answer"
    * I enter answer 2 text "5"
    When I attempt to submit the question
    Then I see error messages
      | empty-answer-explanation |


  Scenario: All answer explanations
    Either all or no answer explanations are required

    Given I start creating a new question
    * I enter question "What is 2 + 2?"
    * I enable explanations
    * I enter answer 1 text "4" and mark it as correct
    * I enter answer 1 explanation "4 is the answer"
    * I enter answer 2 text "5"
    * I enter answer 2 explanation "5 is the answer, but in another universe"
    When I attempt to submit the question
    Then I see no error messages


  Scenario: Single-choice question: No correct answer
    For single-choice question, exactly one correct answer is required

    Given I start creating a new question
    * I enter question "What is 2 + 2?"
    * I enter answer 1 text "4"
    * I enter answer 2 text "5"
    When I attempt to submit the question
    Then I see error messages
      | no-correct-answer |


  Scenario: Single-choice question: No correct answer message disappears after selecting a correct answer
    For single-choice question, exactly one correct answer is required

    Given I start creating a new question
    * I enter question "What is 2 + 2?"
    * I enter answer 1 text "4"
    * I enter answer 2 text "5"
    * I attempt to submit the question
    * I mark answer 1 as correct
    When I attempt to submit the question
    Then I see no error messages


  Scenario: Empty question text error message disappears after adding question text
    Given I start creating a new question
    * I enable explanations
    * I enter answer 1 text "4" and mark it as correct
    * I enter answer 2 text "5"
    * I attempt to submit the question
    * I enter question "What is 2 + 2?"
    When I attempt to submit the question
    Then I see no error messages


  Scenario: Create multiple choice question without correct answer
    Given I start creating a new question
    * I enter question "What are cities of Czech Republic?"
    * I enter answers
      | Brno     |  |
      | Brussels |  |
      | Prague   |  |
      | Berlin   |  |
    When I attempt to submit the question
    Then I see error messages
      | no-correct-answer |


  Scenario: Create multiple choice question with one correct answer
    Given I start creating a new question
    * I enter question "What are cities of Czech Republic?"
    * I enter answers
      | Brno     |  |
      | Brussels |  |
      | Prague   |  |
      | Berlin   |  |
    * I mark answer 2 as correct
    When I mark the question as multiple choice
    And I attempt to submit the question
    Then I see error messages
      | few-correct-answers |


  Scenario: Create multiple choice question with all correct answers
    Given I start creating a new question
    * I enter question "What are cities of Czech Republic?"
    * I enter answers
      | Brno     |  |
      | Brussels |  |
      | Prague   |  |
      | Berlin   |  |
    * I mark answer 2 as correct
    * I mark answer 3 as correct
    * I mark answer 4 as correct
    * I mark answer 1 as correct
    When I attempt to submit the question
    Then I see no error messages


  Scenario: Numerical question validates number format
    Given I start creating a new question
    * I enter question "How many regions does Czechia have?"
    * I mark the question as numerical

    When I attempt to submit the question
    Then I see error messages
      | empty-numerical-answer |

    When I enter numerical correct answer "abc"
    * I attempt to submit the question
    Then I see error messages
      | invalid-numerical-answer |

    When I enter numerical correct answer "3.14"
    * I attempt to submit the question
    Then I see no error messages
