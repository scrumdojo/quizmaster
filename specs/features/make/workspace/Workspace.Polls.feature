Feature: Workspace polls tab
  Makers can browse existing polls from the workspace and open their results.

  Scenario: Polls tab lists existing polls and links to results
    Given workspace "Workshop Polls" with polls
      | poll           | question                       | answers            |
      | Team Mood Poll | How is the team feeling today? | Great, Okay, Stuck |
    When I open the workspace
    Then I see the "Polls" tab
    When I click the "Polls" tab
    Then the "Polls" tab is open
    And I see the "Polls" section
    And I do not see the "Questions" section
    And I do not see the "Quizzes" section
    And I see poll "How is the team feeling today?" in the list
    When I click the "How is the team feeling today?" poll results link
    Then I see poll results question "How is the team feeling today?"
