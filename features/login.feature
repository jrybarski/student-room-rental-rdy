Feature: Login

  Scenario: Successful login user
    Given user opens login page
    When user login in with valid credential
    Then user name should be visible on main page