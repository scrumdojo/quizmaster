Feature: Quiz score page mistakes summary
  On the score page, a summary lists the questions the taker did not answer
  fully correctly, so they can see at a glance what to review before reading
  the full per-question detail below.

  Scenario: Mistakes summary lists only incorrectly answered questions
    Given workspace "Mistakes Summary" with questions
      | bookmark | question                      | answers          |
      | Capital  | What is the capital of Italy? | Rome (*), Naples |
      | Boiling  | Boiling point of water?       | 100 ±5           |
    And quiz "Mistakes Quiz" with all questions
      | pass score | 50 |
    Given I start quiz "Mistakes Quiz"
    When I answer "Rome"
    * I answer "80"
    * I evaluate the quiz
    Then I see question "Boiling point of water?" in the mistakes summary
    And I do not see question "What is the capital of Italy?" in the mistakes summary


  Scenario: Partially correct multi-select question appears in the mistakes summary
    Given workspace "Partial Mistakes" with questions
      | bookmark | question                           | answers                                      |
      | Planets  | Which are planets in solar system? | Mars (*), Pluto, Venus (*), Titan, Earth (*) |
    And quiz "Partial Mistakes Quiz" with all questions
      | pass score | 50 |
    Given I start quiz "Partial Mistakes Quiz"
    When I answer "Mars, Venus"
    * I evaluate the quiz
    Then I see question "Which are planets in solar system?" in the mistakes summary


  Scenario: No mistakes summary is shown when all answers are correct
    Given workspace "No Mistakes" with questions
      | bookmark | question  | answers  |
      | Q1       | 1 + 1 = ? | 2 (*), 3 |
    And quiz "Perfect Quiz" with all questions
      | pass score | 100 |
    Given I start quiz "Perfect Quiz"
    When I answer correctly
    * I evaluate the quiz
    Then I do not see a mistakes summary
