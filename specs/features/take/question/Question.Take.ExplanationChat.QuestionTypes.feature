Feature: Explanation chat context works for every question type
  Slice 2 of the "elaborate on answers" epic. Single-choice question context
  is already covered by Question.Take.ExplanationChat.Context.feature; this
  file locks in that multiple-choice and numerical questions build the same
  kind of context (question, given answer, explanation) correctly, since
  each question type carries the taker's given answer differently.

  @ai
  Scenario: A multiple-choice question's follow-up reflects the taker's given answers
    Given question "Which of these countries are in Europe?"
    * with answers:
      | Italy   | * | Located on the Apennine Peninsula, part of Europe. |
      | France  | * | One of the founding members of the European Union. |
      | Morocco |   | This country is in Africa, not in Europe.          |
    * with explanation "Italy and France are in Europe; Morocco is in Africa."
    * saved and bookmarked as "Europe"
    When I take question "Europe"
    * I answer "Italy, Morocco"
    * I expand the explanation chat
    * I ask the explanation chat "Which one of my answers was wrong, and why?"
    Then I see a reply in the explanation chat mentioning "Morocco"


  @ai
  Scenario: A numerical question's follow-up reflects the taker's given answer
    Given question "What is 7 × 8?"
    * with numerical answer "56"
    * with explanation "7 × 8 equals 56."
    * saved and bookmarked as "Multiplication"
    When I take question "Multiplication"
    * I answer "50"
    * I expand the explanation chat
    * I ask the explanation chat "What was the correct answer, and how far off was mine?"
    Then I see a reply in the explanation chat mentioning "56"
