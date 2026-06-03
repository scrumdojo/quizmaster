Feature: Battle-only mode via the Background game FAB

  Scenario: Selecting "Battle only" from the background game dropdown hides the workspace interface
    Given workspace "Battle"
    When I open the workspace
    And I open the background game dropdown
    And I select battle only mode
    Then the workspace interface is hidden
    And the background animation is visible


  Scenario: Switching the battle theme keeps battle-only mode on
    Given workspace "Battle"
    When I open the workspace
    And I switch the animation to the mammoths theme
    And I select battle only mode
    And I switch the animation to Angels & Devils
    Then the workspace interface is hidden
    And the background animation is visible
