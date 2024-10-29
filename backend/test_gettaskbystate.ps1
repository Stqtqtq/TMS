
Write-Output    "Any points listed are errors"
try {
    # url
    Write-Output ""
    Write-Output "Testing URL"
    Write-Output ""
    $response = Invoke-RestMethod -Method 'Post' -Uri "http://localhost:3000/GetTaskByState?"
    if ($response -is [string]) { $response = $response | ConvertFrom-Json }
    if ($response.code -ne "A001") {
        Write-Output "- url special char, code is $($response.code)"
    }

    $response = Invoke-RestMethod -Method 'Post' -Uri "http://localhost:3000/GetTaskByState"
    if ($response -is [string]) { $response = $response | ConvertFrom-Json }
    if ($response.code -eq "A001") {
        Write-Output "- url camelcase, code is $($response.code)"
    }
    $response = Invoke-RestMethod -Method 'Post' -Uri "http://localhost:3000/GETTASKBYSTATE"
    if ($response -is [string]) { $response = $response | ConvertFrom-Json }
    if ($response.code -eq "A001") {
        Write-Output "- url uppercase, code is $($response.code)"
    }
    $response = Invoke-RestMethod -Method 'Post' -Uri "http://localhost:3000/gettaskbystate"
    if ($response -is [string]) { $response = $response | ConvertFrom-Json }
    if ($response.code -eq "A001") {
        Write-Output "- url lowercase, code is $($response.code)"
    }
    try {
        $response = Invoke-RestMethod -Method 'Get' -Uri "http://localhost:3000/gettaskbystate"
        Write-Output "- request type get, code is $($response.code)"
    }
    catch {
    }

    # body
    Write-Output ""
    Write-Output "URL Tests done, Testing body"
    Write-Output ""
    
    $response = Invoke-RestMethod -Method 'Post' -Uri "http://localhost:3000/gettaskbystate"
    if ($response -is [string]) { $response = $response | ConvertFrom-Json }
    if ($response.code -ne "B001") {
        Write-Output "- missing body, code is $($response.code)"
    }

    $body = @{f = 'f' } | ConvertTo-Json
    $response = Invoke-RestMethod -Method 'Post' -Uri "http://localhost:3000/gettaskbystate" -ContentType "application/javascript" -Body $Body
    if ($response -is [string]) { $response = $response | ConvertFrom-Json }
    if ($response.code -ne "B001") {
        Write-Output "- wrong body type, code is $($response.code)"
    }

    $body = @{} | ConvertTo-Json
    $response = Invoke-RestMethod -Method 'Post' -Uri "http://localhost:3000/gettaskbystate" -ContentType "application/json" -Body $Body
    if ($response -is [string]) { $response = $response | ConvertFrom-Json }
    if ($response.code -ne "B002") {
        Write-Output "- No keys, code is $($response.code)"
    }

    $body = @{username = $username } | ConvertTo-Json
    $response = Invoke-RestMethod -Method 'Post' -Uri "http://localhost:3000/gettaskbystate" -ContentType "application/json" -Body $Body
    if ($response -is [string]) { $response = $response | ConvertFrom-Json }
    if ($response.code -ne "B002") {
        Write-Output "- Partial keys, code is $($response.code)"
    }

    $body = @{
        username         = "*"
        password         = $password
        task_state       = $state
        task_app_acronym = $acronym
        f                = "f"
    } | ConvertTo-Json
    $response = Invoke-RestMethod -Method 'Post' -Uri "http://localhost:3000/gettaskbystate" -ContentType "application/json" -Body $Body
    if ($response -is [string]) { $response = $response | ConvertFrom-Json }
    if ($response.code -eq "B002") {
        Write-Output "- extra keys, code is $($response.code)"
    } 
}
    catch {
    Write-Output "Error: Unable to reach API - $($_.Exception.Message)" 
    exit 1
}

# Get the current script directory
$scriptDir = Split-Path -Path $MyInvocation.MyCommand.Path
$csvPath = Join-Path -Path $scriptDir -ChildPath "test_gettaskbystate.csv"

# Read in the CSV file as an array of objects
$testCases = Import-Csv -Path $csvPath

Write-Output "Running test cases from CSV"

foreach ($testCase in $testCases) {
    # Extract data from each row
    $username = $testCase.username
    $password = $testCase.password
    $taskState = $testCase.task_state
    $taskAppAcronym = $testCase.task_app_acronym
    $expectedCode = $testCase.expected_code

    # Convert numeric fields to integers where required
    if ($username -match '^\d+$') { $username = [int]$username }
    if ($password -match '^\d+$') { $password = [int]$password }
    if ($taskState -match '^\d+$') { $taskState = [int]$taskState }
    if ($taskAppAcronym -match '^\d+$') { $taskAppAcronym = [int]$taskAppAcronym }

    # Construct the body for the Invoke-RestMethod call based on the extracted data
    $body = @{
        username         = $username
        password         = $password
        task_state       = $taskState
        task_app_acronym = $taskAppAcronym
    } | ConvertTo-Json

    # Send the request
    try {
        $response = Invoke-RestMethod -Method 'Post' -Uri "http://localhost:3000/gettaskbystate" -ContentType "application/json" -Body $body
        if ($response -is [string]) { $response = $response | ConvertFrom-Json }
        
        # Check the response code against the expected code
        if ($response.code -ne $expectedCode) {
            Write-Host "- Test case $($testCase.test_case) failed: expected $expectedCode, got $($response.code)" -ForegroundColor Red
        } else {
            Write-Host "- Test case $($testCase.test_case) passed" -ForegroundColor Green
        }
    }
    catch {
        Write-Output "Error with test case $($testCase.test_case): Unable to reach API - $($_.Exception.Message)"
    }
}
