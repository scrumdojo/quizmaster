Feature: Question image preview is grouped with the title

  Scenario: Image preview sits next to the title, separated from the button area
    Given workspace "ImgPos" with questions
      | question              | answers      | image                               |
      | Which animal is this? | Cat (*), Dog | https://placekitten.com/300/200.jpg |
    When I open the workspace
    And I click the "Questions" tab
    Then the image preview is grouped with the title for question "Which animal is this?"
