Feature: Create Poll from Workspace
  A poll is created from the workspace by entering a question and its
  answers. The created poll appears in the workspace's poll list.

  Scenario: Create poll and display it in poll list
    Given workspace "Poll Creation"
    When I start creating a new poll
    * I enter poll question "How often do you run retrospectives?"
    * I enter poll answers
      | Weekly    |
      | Bi-weekly |
      | Monthly   |
    * I submit the poll
    Then I see poll "How often do you run retrospectives?" in the list
