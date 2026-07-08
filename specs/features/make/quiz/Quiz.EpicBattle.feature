Feature: Epic Battle
  From the Share screen, when a quiz has exactly two cohorts, a maker can
  open Epic Battle: a full-page, continuously animated view where the two
  cohorts fight as opposing Roman armies. Each scored answer lands a hit
  for its cohort's army, using the same weighted points as Live stats (1
  point for a correct answer, 0.5 for a partial one) — the more an answer
  is worth, the stronger the blow. The army with more points is winning
  the battle, and the two armies keep clashing continuously even while no
  new answers arrive.

  Background:
    Given quiz "Legion Quiz" with 3 questions


  Scenario: Epic Battle button is hidden when the quiz has no cohorts
    When I navigate to share quiz "Legion Quiz"
    Then I do not see the Epic Battle button


  Scenario: Epic Battle button is hidden with only one cohort
    Given quiz "Legion Quiz" has a cohort named "Alpha"
    When I navigate to share quiz "Legion Quiz"
    Then I do not see the Epic Battle button


  Scenario: Epic Battle button is hidden with three or more cohorts
    Given quiz "Legion Quiz" has cohorts
      | cohort |
      | Alpha  |
      | Beta   |
      | Gamma  |
    When I navigate to share quiz "Legion Quiz"
    Then I do not see the Epic Battle button


  Scenario: Epic Battle button appears with exactly two cohorts
    Given quiz "Legion Quiz" has cohorts
      | cohort |
      | Alpha  |
      | Beta   |
    When I navigate to share quiz "Legion Quiz"
    Then I see the Epic Battle button


  Scenario: Open Epic Battle and see two evenly matched Roman armies
    Given quiz "Legion Quiz" has cohorts
      | cohort |
      | Alpha  |
      | Beta   |
    When I navigate to share quiz "Legion Quiz"
    And I open Epic Battle
    Then I see the Epic Battle page for quiz "Legion Quiz"
    And I see a Roman army for cohort "Alpha"
    And I see a Roman army for cohort "Beta"
    And I see the battle is even


  Scenario: A correct answer lands a hit for its cohort's army
    Given quiz "Legion Quiz" has a cohort named "Alpha"
    * quiz "Legion Quiz" has a cohort named "Beta"
    When I navigate to share quiz "Legion Quiz"
    And I open Epic Battle
    And a participant in cohort "Alpha" starts quiz "Legion Quiz"
    And the participant answers 1 questions correctly
    Then I see the army for cohort "Alpha" has landed 1 hit
    And I see the army for cohort "Beta" has landed 0 hits


  Scenario: A heavier question lands a stronger blow than a lighter one
    Given workspace "Siege" with questions
      | question        | answers       |
      | Ballista volley | Hit (*), Miss |
      | Sling stone     | Hit (*), Miss |
    And quiz "Siege Quiz" with weighted questions
      | question        | weight |
      | Ballista volley | 3      |
      | Sling stone     | 1      |
    And quiz "Siege Quiz" has cohorts
      | cohort |
      | Alpha  |
      | Beta   |
    When I navigate to share quiz "Siege Quiz"
    And I open Epic Battle
    And a participant in cohort "Alpha" answers question "Ballista volley" correctly
    And a participant in cohort "Beta" answers question "Sling stone" correctly
    Then I see the army for cohort "Alpha" has landed 1 hit
    And I see the army for cohort "Beta" has landed 1 hit
    And I see the army for cohort "Alpha" is winning the battle
    And I see the army for cohort "Beta" is losing the battle


  Scenario: A partial answer lands a weaker blow than a full answer
    Given workspace "Skirmish" with questions
      | question             | answers                     |
      | Pick the two consuls | Marius (*), Sulla (*), Cato |
    And quiz "Skirmish Quiz" with questions "Pick the two consuls"
    And quiz "Skirmish Quiz" has cohorts
      | cohort |
      | Alpha  |
      | Beta   |
    When I navigate to share quiz "Skirmish Quiz"
    And I open Epic Battle
    And a participant in cohort "Alpha" answers question "Pick the two consuls" correctly
    And a participant in cohort "Beta" answers question "Pick the two consuls" partially
    Then I see the army for cohort "Alpha" has landed 1 hit
    And I see the army for cohort "Beta" has landed 1 hit
    And I see the army for cohort "Alpha" is winning the battle
    And I see the army for cohort "Beta" is losing the battle


  Scenario: The army with more points is winning the battle
    Given quiz "Legion Quiz" has cohorts
      | cohort |
      | Alpha  |
      | Beta   |
    And cohort "Alpha" has in-progress answers for quiz "Legion Quiz"
      | correct |
      | 2       |
    And cohort "Beta" has in-progress answers for quiz "Legion Quiz"
      | correct |
      | 1       |
    When I navigate to share quiz "Legion Quiz"
    And I open Epic Battle
    Then I see the army for cohort "Alpha" is winning the battle
    And I see the army for cohort "Beta" is losing the battle


  Scenario: The winning army changes as the battle score flips
    Given quiz "Legion Quiz" has cohorts
      | cohort |
      | Alpha  |
      | Beta   |
    And cohort "Beta" has in-progress answers for quiz "Legion Quiz"
      | correct |
      | 2       |
    When I navigate to share quiz "Legion Quiz"
    And I open Epic Battle
    Then I see the army for cohort "Beta" is winning the battle
    When a participant in cohort "Alpha" starts quiz "Legion Quiz"
    And the participant answers 3 questions correctly
    Then I see the army for cohort "Alpha" is winning the battle
    And I see the army for cohort "Beta" is losing the battle


  Scenario: The battle keeps fighting even without new answers
    Given quiz "Legion Quiz" has cohorts
      | cohort |
      | Alpha  |
      | Beta   |
    When I navigate to share quiz "Legion Quiz"
    And I open Epic Battle
    Then I see the two armies actively clashing
