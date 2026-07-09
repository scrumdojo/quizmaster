Feature: Explanation chat responds to different kinds of follow-up needs
  Slice 2 of the "elaborate on answers" epic (AC3/AC4). The taker can ask a
  follow-up for different reasons: an unfamiliar term, a deeper explanation,
  a concrete example, or an alternative explanation/comparison. The AI
  responds to whichever the taker actually asked for, not a fixed template.

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
  Scenario: Explaining an unfamiliar term
    When I ask the explanation chat "What does 'capital city' actually mean?"
    Then I see a reply in the explanation chat mentioning "capital"


  @ai
  Scenario: Asking for a deeper, more detailed explanation
    When I ask the explanation chat "Can you explain in more depth why Rome is the answer?"
    Then I see a reply in the explanation chat mentioning "Rome"


  @ai
  Scenario: Asking for a concrete example
    When I ask the explanation chat "Can you give me an example to illustrate this?"
    Then I see a reply in the explanation chat


  @ai
  Scenario: Asking for an alternative explanation or comparison
    When I ask the explanation chat "Can you explain this using a comparison or analogy?"
    Then I see a reply in the explanation chat
