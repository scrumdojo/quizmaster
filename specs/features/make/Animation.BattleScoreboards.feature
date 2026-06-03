Feature: Battle scoreboards sit on each faction's side

  Scenario: Each scoreboard is on the side of its faction
    Given I am on the home page
    When I switch the animation to Angels & Devils
    Then the Angels scoreboard is on the left side
    And the Satans scoreboard is on the right side


  Scenario: Mammoth battle scoreboards are on each faction's side
    Given I am on the home page
    When I switch the animation to the mammoths theme
    Then the Hunters scoreboard is on the left side
    And the Mammoths scoreboard is on the right side
