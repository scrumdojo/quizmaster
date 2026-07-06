Feature: Show poll results
  The results screen for a specific poll shows the poll question, all
  answers, and the vote counts per answer. The counts refresh while the
  screen stays open, so a maker can watch votes come in live.

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


  Scenario: Results refresh while voters submit votes
    Given workspace "Poll Results" with polls
      | poll            | question                             | answers                    |
      | Retro Frequency | How often do you run retrospectives? | Weekly, Monthly, Quarterly |
    When I open poll "Retro Frequency" results
    Then I see poll "Retro Frequency" results
      | answer    | votes |
      | Weekly    | 0     |
      | Monthly   | 0     |
      | Quarterly | 0     |
    When poll "Retro Frequency" receives votes
      | answer  | count |
      | Weekly  | 2     |
      | Monthly | 1     |
    Then I see poll "Retro Frequency" results
      | answer    | votes |
      | Weekly    | 2     |
      | Monthly   | 1     |
      | Quarterly | 0     |


  Scenario: Results page shows a QR code for taking the poll
    Given workspace "Poll Results" with polls
      | poll           | question                       | answers            |
      | Team Mood Poll | How is the team feeling today? | Great, Okay, Stuck |
    When I open poll "Team Mood Poll" results
    Then I see the poll take QR code
    And the poll QR code value matches the poll take link


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
