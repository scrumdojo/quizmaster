Feature: Explanation chat already knows the question's own content
  Slice 1b of the "elaborate on answers" epic. The explanation chat backend
  looks up the active question by id and seeds the question text, the
  taker's given answer, and the explanation as the opening of the
  conversation, so the taker never has to repeat any of it themselves. This
  keeps working across several follow-up questions in the same session, and
  survives collapsing and re-expanding the chat while the question stays
  active.

  Background:
    Given question "What is capital of Italy?"
    * with answers:
      | Rome     | * | Rome is the capital of Italy              |
      | Florence |   | Florence is the capital of Tuscany region |
    * with explanation "Rome is the capital city of Italy."
    * saved and bookmarked as "Italy"
    When I take question "Italy"
    * I answer "Rome"
    * I expand the explanation chat


  @ai
  Scenario: A follow-up question relies on the question's own content without repeating it
    When I ask the explanation chat "What was the correct answer to this question, and why?"
    Then I see a reply in the explanation chat mentioning "Rome"


  @ai
  Scenario: A second follow-up question in the same session still has the original context
    When I ask the explanation chat "What was the correct answer to this question?"
    * I ask the explanation chat "Give me one interesting fact about it"
    Then I see a reply in the explanation chat mentioning "Rome"


  @ai
  Scenario: Conversation history survives collapsing and re-expanding the chat
    When I ask the explanation chat "What was the correct answer to this question?"
    And I collapse the explanation chat
    And I expand the explanation chat
    Then I see my question "What was the correct answer to this question?" in the explanation chat
    When I ask the explanation chat "Give me one interesting fact about it"
    Then I see a reply in the explanation chat mentioning "Rome"
