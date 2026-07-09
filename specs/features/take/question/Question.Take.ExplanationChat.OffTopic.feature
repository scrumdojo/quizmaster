Feature: Explanation chat stays bounded to the quiz question's topic
  Slice 3 of the "elaborate on answers" epic. The explanation chat is scoped
  to the quiz question it is attached to, not a general-purpose chat. When a
  taker asks something unrelated to the question's topic, the AI gently
  steers the conversation back to the quiz topic instead of answering the
  off-topic request or ending the conversation.

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
  Scenario: An off-topic follow-up question is redirected back to the quiz topic
    When I ask the explanation chat "Can you write me a poem about cats?"
    Then I see a reply in the explanation chat mentioning "Italy"


  @ai
  Scenario: The conversation is not permanently locked after an off-topic detour
    When I ask the explanation chat "Can you write me a poem about cats?"
    * I ask the explanation chat "What was the correct answer to this question?"
    Then I see a reply in the explanation chat mentioning "Rome"
