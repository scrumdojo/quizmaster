Feature: Quiz score page cross-attempt mistake awareness
  On the score page, a question in the mistakes summary is flagged with a note
  when the same taker also missed it on an earlier attempt of the same quiz,
  so recurring mistakes stand out from ones made for the first time.

  Scenario: A question missed on both attempts is flagged as missed before
    Given workspace "Mistake History" with questions
      | bookmark | question                                    | answers               |
      | Capital  | What is the capital of Italy?               | Rome (*), Naples      |
      | Boiling  | What state does water reach at 100 degrees? | Boiling (*), Freezing |
    And quiz "Recall Quiz" with all questions
      | pass score | 50 |
    And quiz "Recall Quiz" has cohorts
      | cohort |
      | Alpha  |
    And quiz "Recall Quiz" has finished cohort attempts
      | cohort | correct |
      | Alpha  | 1       |
    Given I start quiz "Recall Quiz" for cohort "Alpha" again
    When I answer "Rome"
    * I answer "Freezing"
    * I evaluate the quiz
    Then I see question "What state does water reach at 100 degrees?" in the mistakes summary
    And I see a note that I missed "What state does water reach at 100 degrees?" before


  Scenario: A question missed for the first time is not flagged as missed before
    Given workspace "Mistake History Clean" with questions
      | bookmark | question                                    | answers               |
      | Capital  | What is the capital of Italy?               | Rome (*), Naples      |
      | Boiling  | What state does water reach at 100 degrees? | Boiling (*), Freezing |
    And quiz "Repeat Quiz" with all questions
      | pass score | 50 |
    And quiz "Repeat Quiz" has cohorts
      | cohort |
      | Beta   |
    And quiz "Repeat Quiz" has finished cohort attempts
      | cohort | correct |
      | Beta   | 2       |
    Given I start quiz "Repeat Quiz" for cohort "Beta" again
    When I answer "Rome"
    * I answer "Freezing"
    * I evaluate the quiz
    Then I see question "What state does water reach at 100 degrees?" in the mistakes summary
    And I do not see a note that I missed "What state does water reach at 100 degrees?" before


  Scenario: No cross-attempt note on a taker's first attempt of the quiz
    Given workspace "Mistake History First" with questions
      | bookmark | question  | answers  |
      | Sum      | 1 + 1 = ? | 2 (*), 3 |
    And quiz "First Time Quiz" with all questions
      | pass score | 100 |
    Given I start quiz "First Time Quiz"
    When I answer "3"
    * I evaluate the quiz
    Then I see question "1 + 1 = ?" in the mistakes summary
    And I do not see a note that I missed "1 + 1 = ?" before
