Feature: Battle-only mode via the Background game FAB

  Scenario: Selecting "Battle only" from the background game dropdown hides the workspace interface
    Given workspace "Battle"
    When I open the workspace
    And I open the background game dropdown
    And I select battle only mode
    Then the workspace interface is hidden
    And the background animation is visible
