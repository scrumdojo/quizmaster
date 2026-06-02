Feature: Background animation preferences

  Scenario: Turn off the background animation
    Given I am on the home page
    When I turn off the background animation
    Then the background animation is not visible


  Scenario: Switch the background animation to the mammoths theme
    Given I am on the home page
    When I switch the animation to the mammoths theme
    Then the background animation shows the mammoths theme
