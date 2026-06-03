Feature: Vote in a poll
  A participant can open a poll, choose one answer, submit the vote, and
  then sees a thank-you message.
  - The poll page shows the poll question and all available answers
  - The participant can select exactly one answer
  - After submitting the vote, the participant sees a thank-you state

  Background:
    Given poll "Retro cadence" asking "How often do you run retrospectives?"
    * with poll answers:
      | Weekly    |
      | Bi-weekly |
      | Monthly   |


  Scenario: Poll page shows the question and all answers
    When I take poll "Retro cadence"
    Then I see poll question "How often do you run retrospectives?"
    And I see poll answers:
      | Weekly    |
      | Bi-weekly |
      | Monthly   |
    And no poll answer is selected


  Scenario: Poll allows selecting only one answer
    When I take poll "Retro cadence"
    And I select poll answer "Weekly"
    And I select poll answer "Monthly"
    Then only poll answer "Monthly" is selected


  Scenario: Submitting a selected answer shows a thank-you message
    When I take poll "Retro cadence"
    And I select poll answer "Bi-weekly"
    And I submit the poll vote
    Then I see thank you for voting
