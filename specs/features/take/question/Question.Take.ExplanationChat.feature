Feature: Follow-up chat on question explanations
  A taker can open an expandable chat under the explanation to ask a free-form
  follow-up question and get an AI reply, without leaving the app.
  This slice proves only that the chat UI and the backend/OpenRouter plumbing
  work end to end; the reply does not yet draw on the question's own content
  (question, given answer, explanation) — that lands in a later slice.

  Background:
    Given question "What is capital of Italy?"
    * with answers:
      | Rome     | * | Rome is the capital of Italy              |
      | Florence |   | Florence is the capital of Tuscany region |
    * with explanation "Rome is the capital city of Italy."
    * saved and bookmarked as "Italy"
    When I take question "Italy"
    * I answer "Rome"


  @skip
  Scenario: Explanation chat is collapsed by default
    Then I see the question explanation
    And the explanation chat is collapsed


  @skip
  Scenario: Expanding the explanation chat reveals the composer
    When I expand the explanation chat
    Then I see the explanation chat composer


  @ai
  @skip
  Scenario: Asking a follow-up question in the explanation chat returns a reply
    When I expand the explanation chat
    And I ask the explanation chat "Can you explain that differently?"
    Then I see a reply in the explanation chat
