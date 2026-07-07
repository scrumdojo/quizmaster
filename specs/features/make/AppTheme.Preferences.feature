Feature: App theme selector

  Scenario: App theme selector is always visible with its label
    Given I am on the home page
    Then the app theme selector is visible
    And the app theme FAB label reads "Theme"


  Scenario: App theme selector opens a dropdown with all theme options
    Given I am on the home page
    When I open the app theme dropdown
    Then I see all app theme options in the dropdown


  Scenario: Switch the app theme to Windows XP
    Given I am on the home page
    When I select the "Windows XP" app theme
    Then the app theme is "windows-xp"


  Scenario: Switch the app theme to Star Trek
    Given I am on the home page
    When I select the "Star Trek" app theme
    Then the app theme is "star-trek"


  Scenario: The selected app theme persists after a reload
    Given I am on the home page
    When I select the "Windows XP" app theme
    And I refresh the page
    Then the app theme is "windows-xp"
