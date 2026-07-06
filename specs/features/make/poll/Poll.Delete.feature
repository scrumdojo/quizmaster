Feature: Delete Poll
  A poll can be deleted from the workspace along with its collected votes.
  Deletion asks for confirmation first.

  Background:
    Given workspace "Delete Poll" with polls
      | poll           | question                       | answers            |
      | Team Mood Poll | How is the team feeling today? | Great, Okay, Stuck |


  Scenario: Delete poll removes it from the workspace
    When I delete poll "Team Mood Poll" from the workspace
    And I confirm the deletion
    Then I do not see poll "How is the team feeling today?" in the list


  Scenario: Cancelling deletion keeps the poll
    When I delete poll "Team Mood Poll" from the workspace
    And I cancel the deletion
    Then I see poll "How is the team feeling today?" in the list


  Scenario: Deleting a poll with votes succeeds
    Given poll "Team Mood Poll" has votes
      | answer | count |
      | Great  | 2     |
    When I delete poll "Team Mood Poll" from the workspace
    And I confirm the deletion
    Then I do not see poll "How is the team feeling today?" in the list
