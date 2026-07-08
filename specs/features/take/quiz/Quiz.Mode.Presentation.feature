Feature: Take a quiz in Presentation mode
  In Presentation mode every taker is locked to the same question at the
  same time. A taker sees a waiting screen until the presenter releases the
  first question, answers it, then waits again until the presenter releases
  the next one — the page checks in the background, so the next question
  appears automatically without reloading. There is no Back button; once
  released, answering forward is the only way through the quiz.

  Background:
    Given workspace "Talk" with questions
      | question  | answers  |
      | 2 + 2 = ? | 4 (*), 5 |
      | 3 + 3 = ? | 6 (*), 7 |
    And quiz "Keynote Quiz" with all questions
      | mode | presentation |


  Scenario: Taker waits until the presenter releases the first question
    When I start quiz "Keynote Quiz"
    Then I see that I am waiting for the presenter


  @skip
  Scenario: First question appears once released
    Given I start quiz "Keynote Quiz"
    When quiz "Keynote Quiz" releases the next question
    Then I see question "2 + 2 = ?"


  @skip
  Scenario: Taker waits again after answering, until the next question is released
    Given I start quiz "Keynote Quiz"
    And quiz "Keynote Quiz" releases the next question
    When I answer "4"
    Then I see that I am waiting for the presenter
    When quiz "Keynote Quiz" releases the next question
    Then I see question "3 + 3 = ?"


  @skip
  Scenario: No back navigation in Presentation mode
    Given I start quiz "Keynote Quiz"
    And quiz "Keynote Quiz" releases the next question
    And I answer "4"
    And quiz "Keynote Quiz" releases the next question
    Then I see question "3 + 3 = ?"
    And I do not see a back button
