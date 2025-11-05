Feature: Display Quiz Statistics from Quiz
  As a quiz maker, I want to see the statistics of my quiz:
  - number of times the quiz has been started
  - number of times the quiz has been finished
  - average score of the quiz of the finished attempts
  - success rate of the quiz
  - failure rate of the quiz
  - number of timeouts
  - average time taken to finish the quiz

  Scenario Outline: Display initial statistics
    Given a quiz "Quiz" with 2 questions, exam mode and 75% pass score
    When I open quiz stats
    Then I see the quiz statistics page
    * I see quiz name on stats page "Quiz"
    * I see times taken 0
    * I see times finished 0
    * I see average score 0 %
    * I see success rate 0 %
    * I see failure rate 0 %
    * I see timeout count 0
    * I see average time 0 s

  Scenario Outline: Display statistics for filled quiz
    Given a quiz "Quiz" with 2 questions, exam mode and 75% pass score
    When I start the quiz
    * I answer 2 questions correctly
    * I answer 0 questions incorrectly
    * I proceed to the score page
    Then I see the result 2 correct out of 2, 100%, passed, required passScore 75%

    When I open quiz stats
    Then I see the quiz statistics page
    * I see quiz name on stats page "Quiz"
  # * I see times taken 3
  # * I see times finished 2
  # * I see average score 75 %
  # * I see success rate 100 %


  Scenario Outline: refresh evaluated quiz
    Given a quiz "Quiz" with 2 questions, exam mode and 75% pass score
    When I start the quiz
    * I answer 2 questions correctly
    * I answer 0 questions incorrectly
    * I proceed to the score page
    Then I see the result 2 correct out of 2, 100%, passed, required passScore 75%
    When I refresh page
    Then I see the result 2 correct out of 2, 100%, passed, required passScore 75%

