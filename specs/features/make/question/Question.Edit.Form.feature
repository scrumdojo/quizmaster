Feature: Edit question form
  The question edit form loads with all fields prepopulated from the existing
  question. All fields can be modified — question text, answers, correctness,
  explanations — and changes persist after saving. Answers can be deleted.
  The explanation toggle reflects whether the question has existing explanations.

  Scenario: Prepopulated form fields
    Given question "What is the capital of Czech Republic?"
    * with tag "geography"
    * with answers:
      | Brno   |   | No Brno |
      | Prague | * | Yes     |
      | Berlin |   | Germany |
    * with explanation "Czechia is a country in Europe. Czechs love beer."
    * saved and bookmarked as "Czechia"
    When I start editing question "Czechia"
    Then I see question text "What is the capital of Czech Republic?"
    * I see tag "geography"
    * the question is single choice
    * I see the answers fields
      | Brno   |   | No Brno |
      | Prague | * | Yes     |
      | Berlin |   | Germany |
    * I see question explanation "Czechia is a country in Europe. Czechs love beer."


  Scenario: Edit all fields
    Given question "What is the capital of Czech Republic?"
    * with answers:
      | Brno   |   | No Brno |
      | Prague | * | Yes     |
      | Berlin |   | Germany |
    * with explanation "Czechia is a country in Europe. Czechs love beer."
    * saved and bookmarked as "Czechia"
    When I start editing question "Czechia"
    * I enter question "What is the capital of Slovakia?"
    * I enter answer 1 text "It's Brno", incorrect, with explanation "No, it's not Brno"
    * I enter answer 2 text "It's Prague"
    * I enter answer 2 explanation "No, it's not Prague"
    * I enter answer 3 text "It's Bratislava", correct, with explanation "Yes!"
    * I enter question explanation "Slovakia is a country in Europe. Slovaks love borovička."

    And I submit the question
    And I refresh the page
    And I start editing question "Czechia"

    Then I see question text "What is the capital of Slovakia?"
    * the question is single choice
    * I see the answers fields
      | It's Brno       |   | No, it's not Brno   |
      | It's Prague     |   | No, it's not Prague |
      | It's Bratislava | * | Yes!                |
    * I see question explanation "Slovakia is a country in Europe. Slovaks love borovička."


  Scenario: Change single choice to multiple choice
    Given question "What is the capital of Czech Republic?"
    * with answers:
      | Brno   |   | No Brno |
      | Prague | * | Yes     |
      | Berlin |   | Germany |
    * with explanation "Czechia is a country in Europe. Czechs love beer."
    * saved and bookmarked as "Czechia"
    When I start editing question "Czechia"
    * I mark the question as multiple choice
    * I mark answer 1 as correct
    * I mark the question easy
    * I submit the question
    * I start editing question "Czechia"
    Then I see answer 1 as correct
    * I see answer 2 as correct
    * I see answer 3 as incorrect
    * easy is on


  Scenario: Delete one of the prepopulated form fields
    Given question "What is the capital of Czech Republic?"
    * with answers:
      | Brno   |   | No Brno |
      | Prague | * | Yes     |
      | Berlin |   | Germany |
    * with explanation "Czechia is a country in Europe. Czechs love beer."
    * saved and bookmarked as "Czechia"
    When I start editing question "Czechia"
    Then I see question text "What is the capital of Czech Republic?"
    * I can delete 3 answers
    * I delete answer 3
    * I see the answers fields
      | Brno   |   | No Brno |
      | Prague | * | Yes     |


  Scenario: Explanation fields are visible by default
    Given question "What is the capital of Cambodia?"
    * with answers:
      | Brno   |   | No Brno |
      | Prague | * | Yes     |
      | Berlin |   | Germany |
    * saved and bookmarked as "Cambodia"
    When I start editing question "Cambodia"
    Then I see explanations are enabled
    And I see explanation fields


  Scenario: Explanation fields are hidden when disabling explanations
    Given question "What is the capital of Cambodia?"
    * with answers:
      | Brno   |   | No Brno |
      | Prague | * | Yes     |
      | Berlin |   | Germany |
    * saved and bookmarked as "Cambodia"
    When I start editing question "Cambodia"
    And I disable explanations
    Then I see explanations are disabled
    And I do not see explanation fields


  Scenario: Explanation fields are hidden when explanations are empty
    Given question "What is the capital of Cambodia?"
    * with answers:
      | Brno   |   |
      | Prague | * |
      | Berlin |   |
    * saved and bookmarked as "Cambodia"
    When I start editing question "Cambodia"
    Then I see explanations are disabled
    And I do not see explanation fields


  Scenario: Update question from multiple choice to numerical
    Given question "What are cities of Czech Republic?"
    * with answers:
      | Brno   | * | Yes |
      | Prague | * | Yes |
      | Berlin |   | No  |
    * saved and bookmarked as "Cities"
    When I start editing question "Cities"
    And I mark the question as numerical
    And I enter numerical correct answer "14"
    And I submit the question
    And I refresh the page
    And I start editing question "Cities"
    Then the question is numerical
    And I see numerical correct answer "14"
    And I do not see answer fields
    And I do not see Add Answer button
