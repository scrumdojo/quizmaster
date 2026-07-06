Feature: Show stats per tag
  The quiz statistics page breaks down taker performance by question tag,
  so the maker sees how the cohort did per category. Every answer counts
  toward each tag its question carries. Rows are ordered by accuracy
  ascending — weakest category first — with ties broken alphabetically.
  Questions without a tag gather in an "Untagged" row that always sorts
  last: it is not a category, just the leftovers. A quiz where no question
  has a tag shows no tag breakdown at all.

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


  Scenario: Untagged questions gather in an "Untagged" row that always sorts last
    Given workspace "Partially tagged" with questions
      | bookmark | question           | tag   | answers                              |
      | Sprint   | What is a Sprint?  | scrum | Time-boxed iteration (*), A ceremony |
      | Backlog  | What is a Backlog? |       | Ordered list (*), Random list        |
    And quiz "Mixed Quiz" with all questions

    When I start the quiz
    * I answer "Time-boxed iteration"
    * I answer "Random list"
    * I finish the quiz in 5 seconds

    When I open quiz "Mixed Quiz" statistics
    Then I see tag stats table
      | Tag      | Questions | Answered | Correct | Partially Correct | Incorrect | Unanswered |
      | scrum    | 1         | 1        | 100%    | 0 (0%)            | 0 (0%)    | 0          |
      | Untagged | 1         | 1        | 0%      | 0 (0%)            | 1 (100%)  | 0          |


  Scenario: Partially correct and skipped answers are counted per tag
    Given workspace "Astronomy" with questions
      | bookmark | question                           | tag       | answers                                      |
      | Sky      | What color is the sky?             | astronomy | Blue (*), Green, Red                         |
      | Planets  | Which are planets in solar system? | astronomy | Mars (*), Pluto, Venus (*), Titan, Earth (*) |
    And quiz "Astro Quiz" with all questions
      | time limit | 5s |

    When I start the quiz
    * I skip the question
    * I answer "Mars, Venus"
    * 5 seconds pass
    * I evaluate the quiz

    When I open quiz "Astro Quiz" statistics
    Then I see tag stats table
      | Tag       | Questions | Answered | Correct | Partially Correct | Incorrect | Unanswered |
      | astronomy | 2         | 1        | 0%      | 1 (100%)          | 0 (0%)    | 1          |


  Scenario: Tag breakdown is hidden when no question has a tag
    Given quiz "Plain Quiz" with 2 questions
    When I start the quiz
    * I answer 2 questions correctly
    * I finish the quiz in 5 seconds
    When I open quiz "Plain Quiz" statistics
    Then I see summary stats table
      | Started | Finished | Unfinished | Timeout |
      | 1       | 1        | 0          | 0       |
    And I do not see the tag stats table
