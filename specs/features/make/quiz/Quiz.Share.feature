Feature: Share Quiz
  From the workspace, a maker opens the Share screen for a quiz to
  share a quiz without manually reading long URLs from the screen. The
  screen exposes share actions for the quiz take link and lets the maker
  create and manage cohorts; each cohort has its own shareable link and
  QR code. Cohorts can be renamed, and cohorts
  without attempts can be removed from this screen.

  Background:
    Given quiz "Cohort Quiz" with 2 questions


  Scenario: Open the Share screen and see the quiz take link
    When I navigate to share quiz "Cohort Quiz"
    Then I see the quiz take link for "Cohort Quiz"
    And I see no cohorts

    When I follow the quiz take link
    Then I see the "Cohort Quiz" welcome page


  Scenario: List multiple cohorts in alphabetical order
    When I navigate to share quiz "Cohort Quiz"
    * I create a new cohort "Girlz"
    * I create a new cohort "Boyz"
    * I create a new cohort "Mixed"
    Then I see cohorts in alphabetical order
      | Boyz  |
      | Girlz |
      | Mixed |
    And I see a unique quiz take link for each cohort


  Scenario: Reject blank cohort name
    When I navigate to share quiz "Cohort Quiz"
    * I create a new cohort ""
    Then I see no cohorts
    And I see error "empty-cohort-name" on the share screen


  Scenario: Reject duplicate cohort name
    Given I navigate to share quiz "Cohort Quiz"
    * I create a new cohort "Ladies"
    * I see cohorts in alphabetical order
      | Ladies |
    When I create a new cohort "Ladies"
    Then I see cohorts in alphabetical order
      | Ladies |
    And I see error "duplicate-cohort-name" on the share screen


  Scenario: Show QR code for the quiz take link
    When I navigate to share quiz "Cohort Quiz"
    * I show the QR code for the quiz take link
    Then I see the QR code for the quiz take link
    * the QR code value matches the quiz take link
    When I hide the QR code for the quiz take link
    Then I do not see the QR code for the quiz take link


  Scenario: Show QR code for a cohort take link
    Given quiz "Cohort Quiz" has a cohort named "Boyz"
    * quiz "Cohort Quiz" has a cohort named "Girlz"
    When I navigate to share quiz "Cohort Quiz"
    * I show the QR code for cohort "Boyz"
    Then I see the QR code for cohort "Boyz"
    * the QR code value matches the take link for cohort "Boyz"
    * I do not see the QR code for cohort "Girlz"


  Scenario: Copy the quiz take link
    When I navigate to share quiz "Cohort Quiz"
    * I copy the quiz take link
    Then the clipboard contains the quiz take link
    * I see that the quiz take link was copied


  Scenario: Copy a cohort take link
    Given quiz "Cohort Quiz" has a cohort named "Boyz"
    * quiz "Cohort Quiz" has a cohort named "Girlz"
    When I navigate to share quiz "Cohort Quiz"
    * I copy the take link for cohort "Boyz"
    Then the clipboard contains the take link for cohort "Boyz"
    * the clipboard does not contain the take link for cohort "Girlz"
    * I see that the take link for cohort "Boyz" was copied


  Scenario: Rename a cohort
    Given quiz "Cohort Quiz" has a cohort named "Girlz"
    When I navigate to share quiz "Cohort Quiz"
    * I rename cohort "Girlz" to "Ladies"
    Then I see cohorts in alphabetical order
      | Ladies |
    * the take link for cohort "Ladies" uses the same cohort guid as before


  Scenario: Cancel cohort rename
    Given quiz "Cohort Quiz" has a cohort named "Girlz"
    When I navigate to share quiz "Cohort Quiz"
    * I start renaming cohort "Girlz"
    * I cancel renaming cohort "Girlz"
    Then I see cohorts in alphabetical order
      | Girlz |


  Scenario: Reject blank cohort rename
    Given quiz "Cohort Quiz" has a cohort named "Girlz"
    When I navigate to share quiz "Cohort Quiz"
    * I rename cohort "Girlz" to ""
    Then I see cohorts in alphabetical order
      | Girlz |
    * I see error "empty-cohort-name" on the share screen


  Scenario: Reject duplicate cohort rename
    Given quiz "Cohort Quiz" has a cohort named "Girlz"
    * quiz "Cohort Quiz" has a cohort named "Boyz"
    When I navigate to share quiz "Cohort Quiz"
    * I rename cohort "Girlz" to "Boyz"
    Then I see cohorts in alphabetical order
      | Boyz  |
      | Girlz |
    * I see error "duplicate-cohort-name" on the share screen


  Scenario: Delete a cohort without attempts
    Given quiz "Cohort Quiz" has a cohort named "Boyz"
    When I navigate to share quiz "Cohort Quiz"
    * I delete cohort "Boyz"
    Then I see no cohorts


  Scenario: Cannot delete a cohort with attempts
    Given quiz "Cohort Quiz" has a cohort named "Boyz"
    * cohort "Boyz" has an attempt for quiz "Cohort Quiz"
    When I navigate to share quiz "Cohort Quiz"
    Then I cannot delete cohort "Boyz"
