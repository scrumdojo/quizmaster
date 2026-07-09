Feature: Quiz mistakes history page
  A taker can view a persistent, bookmarkable page listing every question they
  have ever missed across their attempts at a quiz, separate from any single
  attempt's score page.

  Scenario: Mistakes history accumulates missed questions across attempts
    Given workspace "History Accumulation" with questions
      | bookmark | question                      | answers             |
      | Capital  | What is the capital of Italy? | Rome (*), Naples    |
      | Planet   | Which is the largest planet?  | Jupiter (*), Saturn |
    And quiz "History Quiz" with all questions
      | pass score | 50 |
    And quiz "History Quiz" has cohorts
      | cohort |
      | Gamma  |
    And quiz "History Quiz" has finished cohort attempts
      | cohort | correct |
      | Gamma  | 1       |
    Given I start quiz "History Quiz" for cohort "Gamma" again
    When I answer "Naples"
    * I answer "Saturn"
    * I evaluate the quiz
    * I open my mistakes history
    Then I see question "What is the capital of Italy?" in my mistakes history
    And I see question "Which is the largest planet?" in my mistakes history


  Scenario: Mistakes history is still available on a fresh visit to its URL
    Given workspace "History Bookmark" with questions
      | bookmark | question  | answers  |
      | Sum      | 1 + 1 = ? | 2 (*), 3 |
    And quiz "Bookmark Quiz" with all questions
      | pass score | 100 |
    And quiz "Bookmark Quiz" has cohorts
      | cohort |
      | Delta  |
    And quiz "Bookmark Quiz" has finished cohort attempts
      | cohort | correct |
      | Delta  | 0       |
    Given I open the mistakes history for quiz "Bookmark Quiz" and cohort "Delta" directly
    Then I see question "1 + 1 = ?" in my mistakes history


  Scenario: No mistakes are shown when nothing has been missed yet
    Given workspace "History Empty" with questions
      | bookmark | question  | answers  |
      | Sum      | 1 + 1 = ? | 2 (*), 3 |
    And quiz "Clean Quiz" with all questions
      | pass score | 100 |
    Given I start quiz "Clean Quiz"
    When I answer correctly
    * I evaluate the quiz
    * I open my mistakes history
    Then I see no mistakes in my history
