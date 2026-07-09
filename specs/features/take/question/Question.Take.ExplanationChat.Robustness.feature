Feature: Explanation chat handles edge cases gracefully
  Slice 5 of the "elaborate on answers" epic. The chat keeps working when a
  question has no explanation, surfaces a clear error instead of a silent
  no-op when the AI call fails, and starts empty again for a fresh attempt.

  Background:
    Given question "What is capital of Italy?"
    * with answers:
      | Rome     | * | Rome is the capital of Italy              |
      | Florence |   | Florence is the capital of Tuscany region |
    * saved and bookmarked as "Italy"


  @ai
  Scenario: The chat still works on a question that has no explanation
    When I take question "Italy"
    * I answer "Rome"
    * I expand the explanation chat
    * I ask the explanation chat "Why is this the correct answer?"
    Then I see a reply in the explanation chat


  Scenario: The chat shows a clear error when the AI call fails, instead of a silent no-op
    Given the explanation chat service is unavailable
    When I take question "Italy"
    * I answer "Rome"
    * I expand the explanation chat
    * I try to ask the explanation chat "Why is this the correct answer?"
    Then I see an explanation chat error "The AI assistant is not configured."


  @ai
  Scenario: Re-answering the question starts the explanation chat empty again
    When I take question "Italy"
    * I answer "Rome"
    * I expand the explanation chat
    * I ask the explanation chat "What was the correct answer to this question?"
    When I answer "Florence"
    Then the explanation chat is collapsed
