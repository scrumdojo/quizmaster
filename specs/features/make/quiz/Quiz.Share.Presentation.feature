Feature: Release questions one at a time in Presentation mode
  A quiz in Presentation mode starts with every question blocked. From the
  Share screen, the maker releases the next question when ready — there is
  no picking an arbitrary question, only one sequential "Release next
  question" action moving through the quiz in order. The action is disabled
  once every question has been released.

  Background:
    Given workspace "Talk" with questions
      | question  | answers  |
      | 2 + 2 = ? | 4 (*), 5 |
      | 3 + 3 = ? | 6 (*), 7 |
      | 4 + 4 = ? | 8 (*), 9 |
    And quiz "Keynote Quiz" with all questions
      | mode | presentation |


  Scenario: All questions start blocked
    When I navigate to share quiz "Keynote Quiz"
    Then I see that no questions have been released for quiz "Keynote Quiz"


  @skip
  Scenario: Release the next question
    When I navigate to share quiz "Keynote Quiz"
    * I release the next question for quiz "Keynote Quiz"
    Then I see that question 1 of quiz "Keynote Quiz" has been released
    And I see that question 2 of quiz "Keynote Quiz" has not been released


  @skip
  Scenario: Release questions in order
    When I navigate to share quiz "Keynote Quiz"
    * I release the next question for quiz "Keynote Quiz"
    * I release the next question for quiz "Keynote Quiz"
    Then I see that question 1 of quiz "Keynote Quiz" has been released
    And I see that question 2 of quiz "Keynote Quiz" has been released
    And I see that question 3 of quiz "Keynote Quiz" has not been released


  @skip
  Scenario: Release action is disabled once every question has been released
    When I navigate to share quiz "Keynote Quiz"
    * I release the next question for quiz "Keynote Quiz"
    * I release the next question for quiz "Keynote Quiz"
    * I release the next question for quiz "Keynote Quiz"
    Then I see that all questions of quiz "Keynote Quiz" have been released
    And I cannot release the next question for quiz "Keynote Quiz"
