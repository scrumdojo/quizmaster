Feature: Workspace question pagination
  Questions in the workspace are paginated, 10 per page, so long lists
  stay manageable. Page links let the maker jump between pages.

  Scenario: First page shows 10 questions when there are more
    Given workspace "Paging" with 11 questions
    When I open the workspace
    Then I see 10 questions on the page
    And I see question page link 2


  Scenario: Navigating to page 2 shows the remaining questions
    Given workspace "Paging" with 11 questions
    When I open the workspace
    And I go to question page 2
    Then I see 1 question on the page
    And I see question page link 1


  Scenario: No page links when there are 10 or fewer questions
    Given workspace "Paging" with 10 questions
    When I open the workspace
    Then I do not see question page links
