Feature: Workspace quiz pagination
  Quizzes in the workspace are paginated, 10 per page, so long lists
  stay manageable. Page links let the maker jump between pages.

  Scenario: First page shows 10 quizzes when there are more
    Given workspace "Paging" with 11 quizzes
    When I open the workspace
    Then I see 10 quizzes on the page
    And I see quiz page link 2


  Scenario: Navigating to page 2 shows the remaining quizzes
    Given workspace "Paging" with 11 quizzes
    When I open the workspace
    And I go to quiz page 2
    Then I see 1 quiz on the page
    And I see quiz page link 1


  Scenario: No page links when there are 10 or fewer quizzes
    Given workspace "Paging" with 10 quizzes
    When I open the workspace
    Then I do not see quiz page links
