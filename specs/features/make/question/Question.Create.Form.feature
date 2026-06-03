Feature: Create question form
  The question creation form starts with sensible defaults: empty question text,
  two empty answer fields, single choice mode, and no explanations visible.
  Answers can be added and removed. The explanation checkbox controls whether
  explanation fields are shown.

  Scenario: Default values
    When I start creating a new question
    * I enable explanations
    Then I see empty question text
    * I see empty tag
    * the question is single choice
    * I see 2 default empty answers
    * I see empty question explanation


  Scenario: Delete second answer out of three
    When I start creating a new question
    * I enter answers
      | AA | * |
      | BB |   |
      | CC |   |
    Then I delete answer 2
    * I see the answers fields
      | AA | * |
      | CC |   |


  Scenario: Explanation fields are hidden by default
    When I start creating a new question
    Then I do not see explanation fields

    When I enable explanations
    Then I see explanations are enabled
    And I see explanation fields


  Scenario: Explain question types
    When I start creating a new question
    Then I see a note explaining the available question types
    And the note explains that single choice requires one correct answer
    And the note explains that multiple choice requires at least two correct answers
    And the note explains that numerical questions require a numeric answer


  Scenario: Explain how to mark correct answers
    When I start creating a new question
    Then I see a note explaining how to mark correct answers


  Scenario: Explain numerical tolerance
    When I start creating a new question
    And I select numerical question type
    Then I see a note explaining numerical tolerance
    And the note explains that zero tolerance requires an exact answer


  Scenario Outline: Show question field tooltip
    When I start creating a new question
    And I focus the help tooltip for "<field>"
    Then I see help text "<help>"
    When I dismiss the help tooltip
    Then I do not see help text "<help>"

    Examples:
      | field                | help                                                                    |
      | Image URL            | Use a direct image URL. A preview appears when the image can be loaded. |
      | Question explanation | This explanation is shown when feedback is available.                   |
      | Tag                  | Tags help you find questions in the workspace and quiz form.            |
