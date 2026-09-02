Feature: Register

  Scenario: Successful register student
    Given user opens register page
    When user registers in as student
    Then success alert should be visible

  Scenario: Successful register owner
    Given user opens register page
    When user registers in as owner
    Then success alert should be visible
  
