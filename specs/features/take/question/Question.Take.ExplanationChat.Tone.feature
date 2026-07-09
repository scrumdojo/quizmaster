Feature: Explanation chat matches the taker's tone, but stays neutral on rudeness
  Slice 4 of the "elaborate on answers" epic. The AI mirrors the taker's tone
  and language, except when the taker is rude or unfriendly — then it stays
  neutral and friendly instead of escalating.

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
  Scenario: A politely phrased follow-up question gets a helpful, on-topic reply
    When I ask the explanation chat "Could you please explain why Rome is correct?"
    Then I see a reply in the explanation chat mentioning "Rome"


  @ai
  Scenario: A rudely phrased follow-up question still gets a neutral, on-topic reply
    When I ask the explanation chat "This explanation is useless, just tell me the stupid answer already."
    Then I see a reply in the explanation chat mentioning "Rome"
    * the explanation chat reply does not contain "stupid"
