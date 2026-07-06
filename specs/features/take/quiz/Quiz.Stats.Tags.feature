Feature: Show stats per tag
  The quiz statistics page breaks down taker performance by question tag,
  so the maker sees how the cohort did per category. Every answer counts
  toward each tag its question carries. Rows are ordered by accuracy
  ascending — weakest category first — with ties broken alphabetically.

  Scenario: Tag breakdown aggregates answers across attempts
    Given workspace "Categorized" with questions
      | bookmark | question              | tag   | answers                              |
      | Sprint   | What is a Sprint?     | scrum | Time-boxed iteration (*), A ceremony |
      | Backlog  | What is a Backlog?    | scrum | Ordered list (*), Random list        |
      | PO       | Who owns the backlog? | roles | Product Owner (*), Scrum Master      |
    And quiz "Tagged Quiz" with all questions

    When I start the quiz
    * I answer "Time-boxed iteration"
    * I answer "Ordered list"
    * I answer "Product Owner"
    * I finish the quiz in 5 seconds

    When I start the quiz
    * I answer "Time-boxed iteration"
    * I answer "Random list"
    * I answer "Scrum Master"
    * I finish the quiz in 5 seconds

    When I open quiz "Tagged Quiz" statistics
    Then I see tag stats table
      | Tag   | Questions | Answered | Correct | Partially Correct | Incorrect | Unanswered |
      | roles | 1         | 2        | 50%     | 0 (0%)            | 1 (50%)   | 0          |
      | scrum | 2         | 4        | 75%     | 0 (0%)            | 1 (25%)   | 0          |


  Scenario: A question with multiple tags counts in every tag
    Given workspace "Multi-tag" with questions
      | bookmark | question               | tag              | answers                          |
      | Sprint   | What is a Sprint?      | scrum, timeboxes | Time-boxed iteration (*), A week |
      | Daily    | What is a Daily Scrum? | timeboxes        | 15-minute event (*), Status call |
    And quiz "Multi-tag Quiz" with all questions

    When I start the quiz
    * I answer "Time-boxed iteration"
    * I answer "Status call"
    * I finish the quiz in 5 seconds

    When I open quiz "Multi-tag Quiz" statistics
    Then I see tag stats table
      | Tag       | Questions | Answered | Correct | Partially Correct | Incorrect | Unanswered |
      | timeboxes | 2         | 2        | 50%     | 0 (0%)            | 1 (50%)   | 0          |
      | scrum     | 1         | 1        | 100%    | 0 (0%)            | 0 (0%)    | 0          |
