Feature: Background animation preferences

  Scenario: Turn off the background animation
    Given I am on the home page
    When I turn off the background animation
    Then the background animation is not visible


  Scenario: Switch the background animation to the mammoths theme
    Given I am on the home page
    When I switch the animation to the mammoths theme
    Then the background animation shows the mammoths theme


  Scenario: Mammoths attack and kill hunters during battle
    Given I am on the home page
    When I switch the animation to the mammoths theme
    Then mammoths can attack and kill hunters


  Scenario: Mammoth button shows a spear cursor
    Given I am on the home page
    When I hover over the mammoth animation option
    Then the cursor changes to a spear


  Scenario: Active workspace tab with a mammoth shows a spear cursor
    Given workspace "Cursor"
    When I open the workspace
    Then the active workspace tab has a spear cursor


  Scenario: Animation settings control is always visible without hovering
    Given I am on the home page
    Then the animation settings control is visible
    And I see all animation options without hovering
