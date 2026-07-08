Feature: Poll answer image
  A poll answer can optionally carry an image alongside its text, mirroring
  how question images work. The image is previewed while editing and
  persists across edits. An answer needs text, an image, or both — not
  necessarily both.

  Scenario: Add an image to a poll answer
    Given workspace "Poll Answer Images"
    When I start creating a new poll
    * I enter poll question "Which retro format do you prefer?"
    * I enter poll answers
      | Starfish |
      | 4Ls      |
    * I attach image "https://example.com/starfish.png" to poll answer 1
    * I submit the poll
    Then I see poll "Which retro format do you prefer?" in the list
    When I start editing poll "Which retro format do you prefer?"
    Then I see poll form answer 1 image "https://example.com/starfish.png"


  Scenario: Poll answer image is optional
    Given workspace "Poll Answer Images"
    When I start creating a new poll
    * I enter poll question "Which retro format do you prefer?"
    * I enter poll answers
      | Starfish |
      | 4Ls      |
    * I submit the poll
    Then I see poll "Which retro format do you prefer?" in the list


  Scenario: An answer with only an image and no text is valid
    Given workspace "Poll Answer Images"
    When I start creating a new poll
    * I enter poll question "Which retro format do you prefer?"
    * I enter poll answers
      |     |
      | 4Ls |
    * I attach image "https://example.com/starfish.png" to poll answer 1
    * I submit the poll
    Then I see poll "Which retro format do you prefer?" in the list


  Scenario: Removing the image from a poll answer keeps its text and votes
    Given workspace "Poll Answer Images" with polls
      | poll  | question                          | answers       |
      | Retro | Which retro format do you prefer? | Starfish, 4Ls |
    And poll "Retro" answer 1 has image "https://example.com/starfish.png"
    And poll "Retro" has votes
      | answer   | count |
      | Starfish | 3     |
    When I start editing poll "Retro"
    * I remove poll answer 1 image
    * I submit the poll
    When I open poll "Retro" results
    Then I see poll "Retro" results
      | answer   | votes |
      | Starfish | 3     |
      | 4Ls      | 0     |


  Scenario: Taker sees the poll answer image
    Given workspace "Poll Answer Images" with polls
      | poll  | question                          | answers       |
      | Retro | Which retro format do you prefer? | Starfish, 4Ls |
    And poll "Retro" answer 1 has image "https://example.com/starfish.png"
    When I take poll "Retro"
    Then I see an image for poll answer "Starfish"
    And I do not see an image for poll answer "4Ls"
