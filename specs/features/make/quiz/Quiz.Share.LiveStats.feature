Feature: Quiz share live stats
  From the Share screen, a maker opens Live stats to watch cohort
  standings while participants answer the quiz. The Live stats button
  appears only when the quiz has at least one cohort. The panel lists
  every cohort with columns Order, Cohort, and Points. Points are
  the total weighted score across all non-dry-run attempts in that cohort,
  including in-progress attempts — each answer contributes its outcome
  points (1 for correct, 0.5 for partial) multiplied by the question
  weight. Cohorts are ordered by Points descending; ties break
  alphabetically by cohort name. The table refreshes after each answer
  is saved.

  Background:
    Given quiz "Workshop Quiz" with 3 questions


  Scenario: Open live stats from the share screen
    Given quiz "Workshop Quiz" has cohorts
      | cohort |
      | Alpha  |
      | Beta   |
    When I navigate to share quiz "Workshop Quiz"
    Then I see the live stats button
    When I open live stats
    Then I see the live stats panel
    And I see the cohort live stats table
      | Order | Cohort | Points |
      | 1     | Alpha  | 0      |
      | 2     | Beta   | 0      |
    When I close live stats
    Then I see the share screen for quiz "Workshop Quiz"


  Scenario: Live stats sits with quiz take link share actions
    Given quiz "Workshop Quiz" has cohorts
      | cohort |
      | Alpha  |
    When I navigate to share quiz "Workshop Quiz"
    Then the live stats button sits with the quiz take link share actions
    And I see a help tooltip for live stats after the live stats button


  Scenario: Live stats button is hidden when the quiz has no cohorts
    When I navigate to share quiz "Workshop Quiz"
    Then I do not see the live stats button


  Scenario: Cohorts are ordered by points in live stats
    Given quiz "Workshop Quiz" has cohorts
      | cohort |
      | Alpha  |
      | Beta   |
    And cohort "Alpha" has in-progress answers for quiz "Workshop Quiz"
      | correct |
      | 2       |
    And cohort "Beta" has in-progress answers for quiz "Workshop Quiz"
      | correct |
      | 1       |
    When I navigate to share quiz "Workshop Quiz"
    And I open live stats
    Then I see the cohort live stats table
      | Order | Cohort | Points |
      | 1     | Alpha  | 2      |
      | 2     | Beta   | 1      |


  Scenario: Live stats updates when a participant submits an answer
    Given quiz "Workshop Quiz" has a cohort named "Alpha"
    When I navigate to share quiz "Workshop Quiz"
    And I open live stats
    And a participant in cohort "Alpha" starts quiz "Workshop Quiz"
    And the participant answers 1 questions correctly
    Then I see the cohort live stats table
      | Order | Cohort | Points |
      | 1     | Alpha  | 1      |


  Scenario: Cohort order changes when points overtake another cohort
    Given quiz "Workshop Quiz" has cohorts
      | cohort |
      | Alpha  |
      | Beta   |
    And cohort "Beta" has in-progress answers for quiz "Workshop Quiz"
      | correct |
      | 2       |
    When I navigate to share quiz "Workshop Quiz"
    And I open live stats
    Then I see the cohort live stats table
      | Order | Cohort | Points |
      | 1     | Beta   | 2      |
      | 2     | Alpha  | 0      |
    When a participant in cohort "Alpha" starts quiz "Workshop Quiz"
    And the participant answers 3 questions correctly
    Then I see the cohort live stats table
      | Order | Cohort | Points |
      | 1     | Alpha  | 3      |
      | 2     | Beta   | 2      |


  Scenario: Live stats sums points across participants in the same cohort
    Given quiz "Workshop Quiz" has a cohort named "Alpha"
    And a participant in cohort "Alpha" starts quiz "Workshop Quiz"
    And the participant answers 1 questions correctly
    And another participant in cohort "Alpha" starts quiz "Workshop Quiz"
    And the other participant answers 2 questions correctly
    When I navigate to share quiz "Workshop Quiz"
    And I open live stats
    Then I see the cohort live stats table
      | Order | Cohort | Points |
      | 1     | Alpha  | 3      |
