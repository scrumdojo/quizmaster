Feature: Show poll results
  The results screen for a specific poll shows the poll question, all
  answers, and the vote counts per answer.

  Scenario: Show vote counts for a specific poll
    Given workspace "Poll Results" with polls
      | poll            | question                             | answers                    |
      | Retro Frequency | How often do you run retrospectives? | Weekly, Monthly, Quarterly |
    And poll "Retro Frequency" has votes
      | answer    | count |
      | Weekly    | 3     |
      | Monthly   | 1     |
      | Quarterly | 0     |
    When I open poll "Retro Frequency" results
    Then I see poll results question "How often do you run retrospectives?"
    And I see poll "Retro Frequency" results
      | answer    | votes |
      | Weekly    | 3     |
      | Monthly   | 1     |
      | Quarterly | 0     |


  Scenario: Show empty vote counts for a new poll
    Given workspace "Poll Results" with polls
      | poll           | question                       | answers            |
      | Team Mood Poll | How is the team feeling today? | Great, Okay, Stuck |
    When I open poll "Team Mood Poll" results
    Then I see poll results question "How is the team feeling today?"
    And I see poll "Team Mood Poll" results
      | answer | votes |
      | Great  | 0     |
      | Okay   | 0     |
      | Stuck  | 0     |
