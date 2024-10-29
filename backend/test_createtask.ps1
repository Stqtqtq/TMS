#insert valid params here
$plusername = "PL"
$plpassword = "admin!23"
$devusername = 'Dev'
$devpassword = "admin!23"
$acronym = "test"
$name = "testAPI"
$notes = 'checking for API from test script'
$plan = 'plan 3'




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

    # iam
    Write-Output ""
    Write-Output "*note duplicate keys cant be tested here"
    Write-Output "Body Tests done, Testing IAM"
    Write-Output ""

    $body = @{
        username         = ""
        password         = $plpassword
        task_app_acronym = $acronym
        task_name        = $name
        task_description = "username missing"
        task_notes       = $notes
        task_plan        = $plan
    } | ConvertTo-Json
    $response = Invoke-RestMethod -Method 'Post' -Uri "http://localhost:3000/createtask" -ContentType "application/json" -Body $Body
    if ($response -is [string]) { $response = $response | ConvertFrom-Json }
    if ($response.code -ne "C001") {
        Write-Output "- username missing, code is $($response.code) but expected is C001"
    }

    $body = @{
        username         = $plusername
        password         = ""
        task_app_acronym = $acronym
        task_name        = $name
        task_description = "password missing"
        task_notes       = $notes
        task_plan        = $plan
    } | ConvertTo-Json
    $response = Invoke-RestMethod -Method 'Post' -Uri "http://localhost:3000/createtask" -ContentType "application/json" -Body $Body
    if ($response -is [string]) { $response = $response | ConvertFrom-Json }
    if ($response.code -ne "C001") {
        Write-Output "- password  missing, code is $($response.code) but expected is C001"
    }

    $body = @{
        username         = 12345
        password         = $plpassword
        task_app_acronym = $acronym
        task_name        = $name
        task_description = "username wrong type"
        task_notes       = $notes
        task_plan        = $plan
    } | ConvertTo-Json
    $response = Invoke-RestMethod -Method 'Post' -Uri "http://localhost:3000/createtask" -ContentType "application/json" -Body $Body
    if ($response -is [string]) { $response = $response | ConvertFrom-Json }
    if ($response.code -ne "C001") {
        Write-Output "- username wrong type, code is $($response.code) but expected is C001"
    }

    $body = @{
        username         = $plusername
        password         = 12345
        task_app_acronym = $acronym
        task_name        = $name
        task_description = "password wrong type"
        task_notes       = $notes
        task_plan        = $plan
    } | ConvertTo-Json
    $response = Invoke-RestMethod -Method 'Post' -Uri "http://localhost:3000/createtask" -ContentType "application/json" -Body $Body
    if ($response -is [string]) { $response = $response | ConvertFrom-Json }
    if ($response.code -ne "C001") {
        Write-Output "- password  wrong type, code is $($response.code) but expected is C001"
    }


    $body = @{
        username         = "123456789012345678901234567890123456789012345678901"
        password         = $plpassword
        task_app_acronym = $acronym
        task_name        = $name
        task_description = "username too long"
        task_notes       = $notes
        task_plan        = $plan
    } | ConvertTo-Json
    $response = Invoke-RestMethod -Method 'Post' -Uri "http://localhost:3000/createtask" -ContentType "application/json" -Body $Body
    if ($response -is [string]) { $response = $response | ConvertFrom-Json }
    if ($response.code -ne "C001") {
        Write-Output "- username too long, code is $($response.code) but expected is C001"
    }

    $body = @{
        username         = $plusername
        password         = "123456789012345678901234567890123456789012345678901"
        task_app_acronym = $acronym
        task_name        = $name
        task_description ="password  too long"
        task_notes       = $notes
        task_plan        = $plan
    } | ConvertTo-Json
    $response = Invoke-RestMethod -Method 'Post' -Uri "http://localhost:3000/createtask" -ContentType "application/json" -Body $Body
    if ($response -is [string]) { $response = $response | ConvertFrom-Json }
    if ($response.code -ne "C001") {
        Write-Output "- password  too long, code is $($response.code) but expected is C001"
    }


    $body = @{
        username         = $plusername 
        password         = 'wrongpassword'
        task_app_acronym = $acronym
        task_name        = $name
        task_description = "Invalid credentials"
    } | ConvertTo-Json
    $response = Invoke-RestMethod -Method 'Post' -Uri "http://localhost:3000/createtask" -ContentType "application/json" -Body $Body
    if ($response -is [string]) { $response = $response | ConvertFrom-Json }
    if ($response.code -ne "C001") {
        Write-Output "- Invalid credentials, code is $($response.code) but expected is C001"
    }

    $body = @{
        username         = $devusername
        password         = $devpassword
        task_app_acronym = $acronym
        task_name        = $name
        task_description = "unauthorised user"
    } | ConvertTo-Json
    $response = Invoke-RestMethod -Method 'Post' -Uri "http://localhost:3000/createtask" -ContentType "application/json" -Body $Body
    if ($response -is [string]) { $response = $response | ConvertFrom-Json }
    if ($response.code -ne "C003") {
        Write-Output "- unauthorised user, code is $($response.code) but expected is C003"
    }

    # transaction
    Write-Output ""
    Write-Output "IAM Tests done, Testing Transaction. WIP, so non exhaustive"
    Write-Output ""

    
    $body = @{
        username         = $plusername
        password         = $plpassword
        task_app_acronym = 12345
        task_name        = $name
        task_description = "acronym wrong type"
        task_notes       = $notes
        task_plan        = $plan
    } | ConvertTo-Json
    $response = Invoke-RestMethod -Method 'Post' -Uri "http://localhost:3000/createtask" -ContentType "application/json" -Body $Body
    if ($response -is [string]) { $response = $response | ConvertFrom-Json }
    if ($response.code -ne "D001") {
        Write-Output "- acronym wrong type, code is $($response.code) but expected is D001 "
    }

    $body = @{
        username         = $plusername
        password         = $plpassword
        task_app_acronym = $acronym
        task_name        = 12345
        task_description = "taskname wrong type"
        task_notes       = $notes
        task_plan        = $plan
    } | ConvertTo-Json
    $response = Invoke-RestMethod -Method 'Post' -Uri "http://localhost:3000/createtask" -ContentType "application/json" -Body $Body
    if ($response -is [string]) { $response = $response | ConvertFrom-Json }
    if ($response.code -ne "D001") {
        Write-Output "- taskname wrong type, code is $($response.code) but expected is D001"
    }

    $body = @{
        username         = $plusername
        password         = $plpassword
        task_app_acronym = $acronym
        task_name        = $name
        task_description = 12345
        task_notes       = "description wrong type"
        task_plan        = $plan
    } | ConvertTo-Json
    $response = Invoke-RestMethod -Method 'Post' -Uri "http://localhost:3000/createtask" -ContentType "application/json" -Body $Body
    if ($response -is [string]) { $response = $response | ConvertFrom-Json }
    if ($response.code -ne "D001") {
        Write-Output "- description wrong type, code is $($response.code) but expected is D001"
    }

    $body = @{
        username         = $plusername
        password         = $plpassword
        task_app_acronym = $acronym
        task_name        = $name
        task_description = "notes wrong type"
        task_notes       = 12345
        task_plan        = $plan
    } | ConvertTo-Json
    $response = Invoke-RestMethod -Method 'Post' -Uri "http://localhost:3000/createtask" -ContentType "application/json" -Body $Body
    if ($response -is [string]) { $response = $response | ConvertFrom-Json }
    if ($response.code -ne "D001") {
        Write-Output "- notes wrong type, code is $($response.code) but expected is D001"
    }

    $body = @{
        username         = $plusername
        password         = $plpassword
        task_app_acronym = $acronym
        task_name        = $name
        task_description = "plan wrong type"
        task_notes       = $notes
        task_plan        = 12345
    } | ConvertTo-Json
    $response = Invoke-RestMethod -Method 'Post' -Uri "http://localhost:3000/createtask" -ContentType "application/json" -Body $Body
    if ($response -is [string]) { $response = $response | ConvertFrom-Json }
    if ($response.code -ne "D001") {
        Write-Output "- plan wrong type, code is $($response.code) but expected is D001"
    }
   


    $body = @{
        username         = $plusername
        password         = $plpassword
        task_app_acronym = "123456789012345678901234567890123456789012345678901"
        task_name        = $name
        task_description = "acronym too long"
        task_notes       = $notes
        task_plan        = $plan
    } | ConvertTo-Json
    $response = Invoke-RestMethod -Method 'Post' -Uri "http://localhost:3000/createtask" -ContentType "application/json" -Body $Body
    if ($response -is [string]) { $response = $response | ConvertFrom-Json }
    if ($response.code -ne "D001") {
        Write-Output "- acronym too long, code is $($response.code) but expected is D001"
    }

    $body = @{
        username         = $plusername
        password         = $plpassword
        task_app_acronym = $acronym
        task_name        = "123456789012345678901234567890123456789012345678901"
        task_description = "taskname too long"
        task_notes       = $notes
        task_plan        = $plan
    } | ConvertTo-Json
    $response = Invoke-RestMethod -Method 'Post' -Uri "http://localhost:3000/createtask" -ContentType "application/json" -Body $Body
    if ($response -is [string]) { $response = $response | ConvertFrom-Json }
    if ($response.code -ne "D001") {
        Write-Output "- taskname too long, code is $($response.code) but expected is D001"
    }

    $body = @{
        username         = $plusername
        password         = $plpassword
        task_app_acronym = $acronym
        task_name        = $name
        task_description = "Lorem ipsum dolor sit amet, consectetuer adipiscing elit. Aenean commodo ligula eget dolor. Aenean massa. Cum sociis natoque penatibus et magnis dis parturient montes, nascetur ridiculus mus. Donec quam felis, ultricies nec, pellentesque eu, pretium quis, sem. Nulla consequat massa quis enim. Donec."
        task_notes       = "description too long"
        task_plan        = $plan
    } | ConvertTo-Json
    $response = Invoke-RestMethod -Method 'Post' -Uri "http://localhost:3000/createtask" -ContentType "application/json" -Body $Body
    if ($response -is [string]) { $response = $response | ConvertFrom-Json }
    if ($response.code -ne "D001") {
        Write-Output "- description too long, code is $($response.code) but expected is D001"
    }

    $body = @{
        username         = $plusername
        password         = $plpassword
        task_app_acronym = $acronym
        task_name        = $name
        task_description = "plan too long"
        task_notes       = $notes
        task_plan        = "123456789012345678901234567890123456789012345678901"
    } | ConvertTo-Json
    $response = Invoke-RestMethod -Method 'Post' -Uri "http://localhost:3000/createtask" -ContentType "application/json" -Body $Body
    if ($response -is [string]) { $response = $response | ConvertFrom-Json }
    if ($response.code -ne "D001") {
        Write-Output "- plan too long, code is $($response.code) but expected is D001"
    }



    $body = @{
        username         = $plusername
        password         = $plpassword
        task_app_acronym = ""
        task_name        = $name
        task_description = "acronym missing"
        task_notes       = $notes
        task_plan        = $plan
    } | ConvertTo-Json
    $response = Invoke-RestMethod -Method 'Post' -Uri "http://localhost:3000/createtask" -ContentType "application/json" -Body $Body
    if ($response -is [string]) { $response = $response | ConvertFrom-Json }
    if ($response.code -ne "D001") {
        Write-Output "- acronym missing, code is $($response.code) but expected is D001"
    }

    $body = @{
        username         = $plusername
        password         = $plpassword
        task_app_acronym = $acronym
        task_name        = ""
        task_description = "taskname missing"
        task_notes       = $notes
        task_plan        = $plan
    } | ConvertTo-Json
    $response = Invoke-RestMethod -Method 'Post' -Uri "http://localhost:3000/createtask" -ContentType "application/json" -Body $Body
    if ($response -is [string]) { $response = $response | ConvertFrom-Json }
    if ($response.code -ne "D001") {
        Write-Output "- taskname missing, code is $($response.code) but expected is D001"
    }

    $body = @{
        username         = $plusername
        password         = $plpassword
        task_app_acronym = $acronym
        task_name        = $name
        task_description = ""
        task_notes       = "description missing"
        task_plan        = $plan
    } | ConvertTo-Json
    $response = Invoke-RestMethod -Method 'Post' -Uri "http://localhost:3000/createtask" -ContentType "application/json" -Body $Body
    if ($response -is [string]) { $response = $response | ConvertFrom-Json }
    if ($response.code -ne "S000") {
        Write-Output "- description missing, code is $($response.code) but expected is S000"
    }

    $body = @{
        username         = $plusername
        password         = $plpassword
        task_app_acronym = $acronym
        task_name        = $name
        task_description = "notes missing"
        task_notes       = ""
        task_plan        = $plan
    } | ConvertTo-Json
    $response = Invoke-RestMethod -Method 'Post' -Uri "http://localhost:3000/createtask" -ContentType "application/json" -Body $Body
    if ($response -is [string]) { $response = $response | ConvertFrom-Json }
    if ($response.code -ne "S000") {
        Write-Output "- notes missing, code is $($response.code) but expected is S000"
    }

    $body = @{
        username         = $plusername
        password         = $plpassword
        task_app_acronym = $acronym
        task_name        = $name
        task_description = "plan missing"
        task_notes       = $notes
        task_plan        = ""
    } | ConvertTo-Json
    $response = Invoke-RestMethod -Method 'Post' -Uri "http://localhost:3000/createtask" -ContentType "application/json" -Body $Body
    if ($response -is [string]) { $response = $response | ConvertFrom-Json }
    if ($response.code -ne "S000") {
        Write-Output "- plan missing, code is $($response.code) but expected is S000"
    }

    $body = @{
        username         = $plusername
        password         = $plpassword
        task_app_acronym = "this should be DNE!"
        task_name        = $name
        task_description = "acronym dne"
        task_notes       = $notes
        task_plan        = $plan
    } | ConvertTo-Json
    $response = Invoke-RestMethod -Method 'Post' -Uri "http://localhost:3000/createtask" -ContentType "application/json" -Body $Body
    if ($response -is [string]) { $response = $response | ConvertFrom-Json }
    if ($response.code -ne "D001") {
        Write-Output "- acronym dne, code is $($response.code) but expected is D001"
    }

    $body = @{
        username         = $plusername
        password         = $plpassword
        task_app_acronym = $acronym
        task_name        = "invalid!"
        task_description = "taskname invalid"
        task_notes       = $notes
        task_plan        = $plan
    } | ConvertTo-Json
    $response = Invoke-RestMethod -Method 'Post' -Uri "http://localhost:3000/createtask" -ContentType "application/json" -Body $Body
    if ($response -is [string]) { $response = $response | ConvertFrom-Json }
    if ($response.code -ne "D001") {
        Write-Output "- taskname invalid, code is $($response.code) but expected is D001"
    }

    # visual test
    Write-Output ""
    Write-Output "automated tests done, check value of state from db"
    Write-Output ""
        
    $body = @{
        username         = $plusername
        password         = $plpassword
        task_app_acronym = $acronym
        task_name        = $name
        task_description = "visual"
        task_notes       = $notes
        task_plan        = $plan
    } | ConvertTo-Json
    $response = Invoke-RestMethod -Method 'Post' -Uri "http://localhost:3000/createtask" -ContentType "application/json" -Body $Body
    if ($response -is [string]) { $response = $response | ConvertFrom-Json }
    Write-Output $response.task_id
    Write-Output ""
    Write-Output $response.code

    $response = Invoke-RestMethod -Method 'Post' -Uri "http://localhost:3000/createtask" -ContentType "application/json" -Body $Body
    if ($response -is [string]) { $response = $response | ConvertFrom-Json }
    Write-Output $response.task_id
    Write-Output ""
    Write-Output $response.code
}
catch {
    Write-Output "Error: Unable to reach API - $($_.Exception.Message)" 
    exit 1
}
