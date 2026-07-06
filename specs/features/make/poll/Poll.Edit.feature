Feature: Edit Poll in Workspace
  An existing poll can be edited from the workspace. The edit form loads
  prefilled with the poll question and all its answers. Votes already
  collected for an answer survive a text edit.

  Background:
    Given workspace "Poll Editing" with polls
      | poll            | question                             | answers                    |
      | Retro Frequency | How often do you run retrospectives? | Weekly, Monthly, Quarterly |


  Scenario: Prepopulated poll form
    When I start editing poll "Retro Frequency"
    Then I see poll form question "How often do you run retrospectives?"
    And I see poll form answers
      | Weekly    |
      | Monthly   |
      | Quarterly |


  Scenario: Removed answer loses its votes, added answer starts at zero
    Given poll "Retro Frequency" has votes
      | answer    | count |
      | Weekly    | 3     |
      | Quarterly | 2     |
    When I start editing poll "Retro Frequency"
    * I delete poll answer 3
    * I add poll answer "Yearly"
    * I submit the poll
    When I open poll "Retro Frequency" results
    Then I see poll "Retro Frequency" results
      | answer  | votes |
      | Weekly  | 3     |
      | Monthly | 0     |
      | Yearly  | 0     |


  Scenario: Edited question and answers keep collected votes
    Given poll "Retro Frequency" has votes
      | answer  | count |
      | Weekly  | 3     |
      | Monthly | 1     |
    When I start editing poll "Retro Frequency"
    * I enter poll question "How often does your team retrospect?"
    * I enter poll answer 1 text "Every week"
    * I submit the poll
    Then I see poll "How often does your team retrospect?" in the list
    When I open poll "Retro Frequency" results
    Then I see poll results question "How often does your team retrospect?"
    And I see poll "Retro Frequency" results
      | answer     | votes |
      | Every week | 3     |
      | Monthly    | 1     |
      | Quarterly  | 0     |
