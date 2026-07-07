Feature: Background animation preferences

  Scenario: Turn off the background animation
    Given I am on the home page
    When I turn off the background animation
    Then the background animation is not visible


  Scenario: Switch the background animation to the mammoths theme
    Given I am on the home page
    When I switch the animation to the mammoths theme
    Then the background animation shows the mammoths theme


  Scenario: A giant mammoth with 100 lives periodically appears during the battle
    Given I am on the home page
    When I switch the animation to the mammoths theme
    Then a giant mammoth with 100 lives can appear


  Scenario: The giant mammoth is a monster that stomps and throws stones at hunters
    Given I am on the home page
    When I switch the animation to the mammoths theme
    Then the giant mammoth stomps nearby hunters
    And the giant mammoth throws stones at hunters


  Scenario: Mammoths attack and kill hunters during battle
    Given I am on the home page
    When I switch the animation to the mammoths theme
    Then mammoths can attack and kill hunters


  Scenario: Hunters carry ten spears and return to base to resupply
    Given I am on the home page
    When I switch the animation to the mammoths theme
    Then each hunter carries 10 spears
    And hunters return to base to resupply when out of spears


  Scenario: Clicking a hunter instantly kills it with a footprint effect
    Given I am on the home page
    When I switch the animation to the mammoths theme
    Then clicking a hunter kills it with a footprint effect


  Scenario: Clicking a mammoth instantly kills it with an explosion effect
    Given I am on the home page
    When I switch the animation to the mammoths theme
    Then clicking a mammoth kills it with an explosion effect


  Scenario: Hovering over a mammoth sprite shows a spear cursor
    Given I am on the home page
    When I switch the animation to the mammoths theme
    Then hovering over a mammoth shows a spear cursor


  Scenario: Hovering over a hunter sprite shows a paw cursor
    Given I am on the home page
    When I switch the animation to the mammoths theme
    Then hovering over a hunter shows a paw cursor


  Scenario: Mammoth button shows a spear cursor
    Given I am on the home page
    When I hover over the mammoth animation option
    Then the cursor changes to a spear


  Scenario: Active workspace tab with a mammoth shows a spear cursor
    Given workspace "Cursor"
    When I open the workspace
    Then the active workspace tab has a spear cursor


  Scenario: Background game FAB is always visible with its label
    Given I am on the home page
    Then the animation settings control is visible
    And the background game FAB label reads "Background game"


  Scenario: Background game FAB opens a dropdown with all animation options
    Given I am on the home page
    When I open the background game dropdown
    Then I see all animation options in the dropdown


  Scenario: Mammoths always stay within the screen
    Given I am on the home page
    When I switch the animation to the mammoths theme
    Then mammoths are contained within the screen


  Scenario: Basic mammoths are tough and have 10 lives
    Given I am on the home page
    When I switch the animation to the mammoths theme
    Then basic mammoths have 10 lives


  Scenario: Mammoths are ninja fighters and can dodge incoming attacks
    Given I am on the home page
    When I switch the animation to the mammoths theme
    Then mammoths can dodge incoming attacks
    And dodges are visually shown


  Scenario: Cave throat singing plays during the mammoth battle
    Given I am on the home page
    When I switch the animation to the mammoths theme
    Then cave throat singing audio plays during the battle


  Scenario: Switch the background animation to a fun photo
    Given I am on the home page
    When I switch the animation to the photo theme
    Then the background animation is not visible
    And a background photo is shown
    And the background photo category is one of the fun categories


  Scenario: The same question always shows the same fun photo
    Given question "Which animal is on the picture?"
    * with answers:
      | Cat | * |
      | Dog |   |
    * saved and bookmarked as "Animals"
    When I take question "Animals"
    And I switch the animation to the photo theme
    Then I remember the background photo category
    When I refresh the page
    Then the background photo category is unchanged
