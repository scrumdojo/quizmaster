Feature: Buzzer quiz synchronized start
  In Buzzer mode, exactly two teams share a quiz. Once the second team
  joins, a 10-second countdown starts for both; when it reaches zero,
  the first question appears to both teams at the same time.

  Background:
    Given workspace "Buzzer" with questions
      | question  | answers  |
      | 1 + 1 = ? | 2 (*), 3 |
    And quiz "Buzzer Quiz" with all questions
      | mode | buzzer |
    And quiz "Buzzer Quiz" has cohorts
      | cohort |
      | Team A |
      | Team B |


  Scenario: Countdown waits until the second team joins
    When "Team A" logs in to quiz "Buzzer Quiz"
    Then "Team A" does not see the countdown timer


  Scenario: First question appears to both teams when the countdown ends
    Given "Team A" logs in to quiz "Buzzer Quiz"
    When "Team B" logs in to quiz "Buzzer Quiz"
    Then both teams see the countdown timer "10"
    When 10 seconds pass
    Then both teams see question "1 + 1 = ?"
