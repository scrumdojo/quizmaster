Feature: Show stats
  After completing a quiz, statistics are available showing results per attempt.
  The stats page displays a summary table (started, finished, unfinished, timeout)
  and an attempt table with duration, score, and status per attempt.


  Scenario: Show empty stats page for quiz
    Given quiz "Quiz" with 2 questions
    When I open quiz "Quiz" statistics
    Then I see summary stats table
      | Started | Finished | Unfinished | Timeout |
      |       0 |        0 |          0 |       0 |
    And I see empty attempt stats table


  Scenario: Attempt and summary statistics for evaluated attempts
    Given quiz "Stats Quiz" with 2 questions
      | time limit | 30s |

    # Attempt finishes on time
    When I start the quiz
    * I answer 2 questions correctly
    * I finish the quiz in 10 seconds

    # Attempt finishes on time
    When I start the quiz
    * I answer 1 questions correctly
    * I answer 1 questions incorrectly
    * I finish the quiz in 20 seconds

    # Attempt time outs
    When I start the quiz
    * I answer 1 questions correctly
    * 30 seconds pass
    * I evaluate the quiz

    # Attempt time outs, quiz taker takes their time to proceed to evaluation
    # Duration is capped at time limit (30s), not wall-clock time (35s)
    When I start the quiz
    * I answer 2 questions incorrectly
    * 35 seconds pass
    * I evaluate the quiz

    When I open quiz "Stats Quiz" statistics
    Then I see attempt stats table
      | Duration | Points | Correct Answers | Incorrect Answers | Score | Status   |
      | 30s      | 0/2    | 0 (0%)          | 2 (100%)          | 0     | Timeout  |
      | 30s      | 1/2    | 1 (50%)         | 1 (50%)           | 50    | Timeout  |
      | 20s      | 1/2    | 1 (50%)         | 1 (50%)           | 50    | Finished |
      | 10s      | 2/2    | 2 (100%)        | 0 (0%)            | 100   | Finished |
    And I see summary stats table
      | Started | Finished | Unfinished | Timeout |
      |       4 |        2 |          0 |       2 |


  Scenario: In-progress attempt shows in statistics
    Given quiz "Stats Quiz" with 2 questions
      | time limit | 60s |

    When I start the quiz
    * I answer 1 questions correctly

    When I open quiz "Stats Quiz" statistics
    Then I see attempt stats table
      | Duration | Points | Correct Answers | Incorrect Answers | Score | Status      |
      |          | 1/2    | 1 (50%)         | 0 (0%)            | 50    | In Progress |
    And I see summary stats table
      | Started | Finished | Unfinished | Timeout |
      |       1 |        0 |          1 |       0 |


  Scenario: Abandoned attempt shows in statistics when time limit expires
    Given quiz "Stats Quiz" with 2 questions
      | time limit | 5s |

    When I start the quiz
    * I answer 1 questions correctly
    * 5 seconds pass

    When I open quiz "Stats Quiz" statistics
    Then I see attempt stats table
      | Duration | Points | Correct Answers | Incorrect Answers | Score | Status    |
      |          | 1/2    | 1 (50%)         | 0 (0%)            | 50    | Abandoned |
    And I see summary stats table
      | Started | Finished | Unfinished | Timeout |
      |       1 |        0 |          1 |       0 |

  Scenario: Test playwright
    Given quiz "Stats Quiz" with 3 questions
      | time limit | 5s |

    When I start the quiz
    * I answer 1 question correctly
    * I answer 1 question partially correctly
    * I answer 1 question incorrectly
    * 5 seconds pass

    When I open quiz "Stats Quiz" statistics
    Then I see attempt stats table
      | Duration | Points | Correct Answers | Partially Correct Answers | Incorrect Answers | Score | Status    |
      |          | 3/2    | 1 (33%)         | 1 (33%)                   | 1 (33%)           | 50    | Finished |
    And I see summary stats table
      | Started | Finished | Unfinished | Timeout |
      |       1 |        1 |          0 |       0 |
