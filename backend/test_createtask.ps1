#insert valid params here
$plusername = "testpl"
$plpassword = "abc123!!"
$acronym = "test"
$name = "testAPI"
$notes = 'checking for API from test script'
$plan = 'plan 3'

# Get the current script directory
$scriptDir = Split-Path -Path $MyInvocation.MyCommand.Path
$csvPath = Join-Path -Path $scriptDir -ChildPath "test - createtask.csv"

# Read in the CSV file as an array of objects
$testCases = Import-Csv -Path $csvPath


Write-Output    "Any points listed are errors"
try {
    # url
    Write-Output ""
    Write-Output "Testing URL"
    Write-Output ""
    $response = Invoke-RestMethod -Method 'Post' -Uri "http://localhost:3000/CreateTask?"
    if ($response -is [string]) { $response = $response | ConvertFrom-Json }
    if ($response.code -ne "A001") {
        Write-Output "- url special char, code is $($response.code) but expected is A001"
    }

    $response = Invoke-RestMethod -Method 'Post' -Uri "http://localhost:3000/CreateTask"
    if ($response -is [string]) { $response = $response | ConvertFrom-Json }
    if ($response.code -eq "A001") {
        Write-Output "- url camelcase, code is $($response.code) but expected is not A001"
    }
    $response = Invoke-RestMethod -Method 'Post' -Uri "http://localhost:3000/CREATETASK"
    if ($response -is [string]) { $response = $response | ConvertFrom-Json }
    if ($response.code -eq "A001") {
        Write-Output "- url uppercase, code is $($response.code) but expected is not A001"
    }
    $response = Invoke-RestMethod -Method 'Post' -Uri "http://localhost:3000/createtask"
    if ($response -is [string]) { $response = $response | ConvertFrom-Json }
    if ($response.code -eq "A001") {
        Write-Output "- url lowercase, code is $($response.code) but expected is not A001"
    }
    try {
        $response = Invoke-RestMethod -Method 'Get' -Uri "http://localhost:3000/createtask"
        Write-Output "- request type get, code is $($response.code) but expected is nothing"
    }
    catch {
    }

    # body
    Write-Output ""
    Write-Output "URL Tests done, Testing body"
    Write-Output ""
    
    $response = Invoke-RestMethod -Method 'Post' -Uri "http://localhost:3000/createtask"
    if ($response -is [string]) { $response = $response | ConvertFrom-Json }
    if ($response.code -ne "B001") {
        Write-Output "- missing body, code is $($response.code) but expected is B001"
    }

    $body = @{f = 'f' } | ConvertTo-Json
    $response = Invoke-RestMethod -Method 'Post' -Uri "http://localhost:3000/createtask" -ContentType "application/javascript" -Body $Body
    if ($response -is [string]) { $response = $response | ConvertFrom-Json }
    if ($response.code -ne "B001") {
        Write-Output "- wrong body type, code is $($response.code) but expected is B001"
    }

    $body = @{} | ConvertTo-Json
    $response = Invoke-RestMethod -Method 'Post' -Uri "http://localhost:3000/createtask" -ContentType "application/json" -Body $Body
    if ($response -is [string]) { $response = $response | ConvertFrom-Json }
    if ($response.code -ne "B002") {
        Write-Output "- No keys, code is $($response.code) but expected is B002"
    }

    $body = @{username = $plusername } | ConvertTo-Json
    $response = Invoke-RestMethod -Method 'Post' -Uri "http://localhost:3000/createtask" -ContentType "application/json" -Body $Body
    if ($response -is [string]) { $response = $response | ConvertFrom-Json }
    if ($response.code -ne "B002") {
        Write-Output "- Partial keys, code is $($response.code) but expected is B002"
    }

    $body = @{
        username         = $plusername
        password         = $plpassword
        task_app_acronym = $acronym
        task_name        = "no optional keys"
    } | ConvertTo-Json
    $response = Invoke-RestMethod -Method 'Post' -Uri "http://localhost:3000/createtask" -ContentType "application/json" -Body $Body
    if ($response -is [string]) { $response = $response | ConvertFrom-Json }
    if ($response.code -ne "S000") {
        Write-Output "- no optional keys, code is $($response.code) but expected is S000"
    }

    $body = @{
        username         = "*"
        password         = $plpassword
        task_app_acronym = $acronym
        task_name        = $name
        task_description = 'extra keys'
        task_notes       = $notes
        task_plan        = $plan
        f                = "f"
    } | ConvertTo-Json
    $response = Invoke-RestMethod -Method 'Post' -Uri "http://localhost:3000/createtask" -ContentType "application/json" -Body $Body
    if ($response -is [string]) { $response = $response | ConvertFrom-Json }
    if ($response.code -eq "B002") {
        Write-Output "- extra keys, code is $($response.code) but expected is not B002"
    }
}
    catch {
    Write-Output "Error: Unable to reach API - $($_.Exception.Message)" 
    exit 1
}

Write-Output "Running test cases from CSV"

foreach ($testCase in $testCases) {
    # Extract data from each row
    $username = $testCase.username
    $password = $testCase.password
    $taskState = $testCase.task_state
    $taskAppAcronym = $testCase.task_app_acronym
    $taskName = $testCase.task_name
    $taskDescription = $testCase.task_description
    $taskNotes = $testCase.task_notes
    $taskPlan = $testCase.task_plan
    $expectedCode = $testCase.expected_code

    # Convert numeric fields to integers where required
    if ($username -match '^\d+$') { $username = [int]$username }
    if ($password -match '^\d+$') { $password = [int]$password }
    if ($taskState -match '^\d+$') { $taskState = [int]$taskState }
    if ($taskAppAcronym -match '^\d+$') { $taskAppAcronym = [int]$taskAppAcronym }
    if ($taskName -match '^\d+$') { $taskName = [int]$taskName }
    if ($taskDescription -match '^\d+$') { $taskDescription = [int]$taskDescription }
    if ($taskNotes -match '^\d+$') { $taskNotes = [int]$taskNotes }
    if ($taskPlan -match '^\d+$') { $taskPlan = [int]$taskPlan }

    # Construct the body for the Invoke-RestMethod call based on the extracted data
    $body = @{
        username         = $username
        password         = $password
        task_state       = $taskState
        task_app_acronym = $taskAppAcronym
        task_name        = $taskName
        task_description = $taskDescription
        task_notes       = $taskNotes
        task_plan        = $taskPlan
    } | ConvertTo-Json

    # Send the request
    try {
        $response = Invoke-RestMethod -Method 'Post' -Uri "http://localhost:3000/createtask" -ContentType "application/json" -Body $Body
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
