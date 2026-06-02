Feature: Make-side back button navigation
  Each creation and edit form has a back button that returns the user
  to the workspace page.

  Scenario Outline: Back from a create form
    Given workspace "Navigation"
    When I start creating a new <thing>
    And I navigate back to the workspace
    Then I see the workspace "Navigation"

    Examples:
      | thing    |
      | question |

    @skip
    Examples:
      | thing |
      | quiz  |


  Scenario: Back from question editing
    Given workspace "Navigation" with questions
      | question  | answers  |
      | 2 + 2 = ? | 4 (*), 5 |
    When I edit question "2 + 2 = ?" from the list
    And I navigate back to the workspace
    Then I see the workspace "Navigation"


  Scenario: Back from quiz editing
    Given workspace "Navigation"
    And quiz "Nav Quiz" with 2 questions
    When I navigate to edit quiz "Nav Quiz"
    And I navigate back to the workspace
    Then I see the workspace "Navigation"
