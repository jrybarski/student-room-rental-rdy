Feature: Filter

  Scenario: Successful login user
    Given user open main page
    When user click at scope icon
    When user filter out properties
    Then user should see only 'Miły pokój w centrum' room