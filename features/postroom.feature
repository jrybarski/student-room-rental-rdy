 Feature: Adding new room

  Scenario: Successful adding new room by owner
    Given user open login page
    When user login into account with valid credentials
    When user click Panel button
    When user delete already existing room
    When user click Dodaj ogloszenie button
    When user fill room's form with valid credentials
    Then room should be visible in dashboard
    Then room should be visible in main page