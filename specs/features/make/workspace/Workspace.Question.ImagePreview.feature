Feature: Question image preview in the title row

  Scenario: Question with image shows preview to the right of the title
    Given workspace "Preview" with questions
      | question              | answers      | image                               |
      | Which animal is this? | Cat (*), Dog | https://placekitten.com/300/200.jpg |
      | 2 + 2 = ?             | 4 (*), 5     |                                     |
    When I open the workspace
    And I click the "Questions" tab
    Then I see the image preview inside the title row for question "Which animal is this?"
    And I do not see an image preview inside the title row for question "2 + 2 = ?"
