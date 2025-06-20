# Splitwise Clone - Quick Test (PowerShell)
# This script tests the core functionality of the application

Write-Host "🚀 Splitwise Clone - Testing Script" -ForegroundColor Green
Write-Host "==================================" -ForegroundColor Green

$BaseUrl = "http://localhost:8000"

# Function to check if service is running
function Test-Service {
    try {
        $response = Invoke-RestMethod -Uri "$BaseUrl/users/" -Method Get -ErrorAction Stop
        Write-Host "✅ Backend is running" -ForegroundColor Green
        return $true
    }
    catch {
        Write-Host "❌ Backend is not running. Please start with: docker-compose up" -ForegroundColor Red
        return $false
    }
}

# Function to create test data
function New-TestData {
    Write-Host ""
    Write-Host "📝 Creating test data..." -ForegroundColor Yellow
    
    # Create users
    Write-Host "Creating users..."
    $alice = Invoke-RestMethod -Uri "$BaseUrl/users/" -Method Post -ContentType "application/json" -Body '{"name": "Alice Johnson", "email": "alice@test.com"}'
    $bob = Invoke-RestMethod -Uri "$BaseUrl/users/" -Method Post -ContentType "application/json" -Body '{"name": "Bob Smith", "email": "bob@test.com"}'
    $charlie = Invoke-RestMethod -Uri "$BaseUrl/users/" -Method Post -ContentType "application/json" -Body '{"name": "Charlie Brown", "email": "charlie@test.com"}'
    
    Write-Host "✅ Created users: Alice (ID: $($alice.id)), Bob (ID: $($bob.id)), Charlie (ID: $($charlie.id))" -ForegroundColor Green
    
    # Create group
    Write-Host "Creating group..."
    $groupData = @{
        name = "Weekend Trip"
        description = "Our weekend getaway"
        user_ids = @($alice.id, $bob.id, $charlie.id)
    } | ConvertTo-Json
    
    $group = Invoke-RestMethod -Uri "$BaseUrl/groups/" -Method Post -ContentType "application/json" -Body $groupData
    Write-Host "✅ Created group: Weekend Trip (ID: $($group.id))" -ForegroundColor Green
    
    # Add expenses
    Write-Host "Adding expenses..."
    
    # Equal split expense
    $expense1 = @{
        description = "Dinner at restaurant"
        amount = 120.0
        paid_by = $alice.id
        split_type = "equal"
    } | ConvertTo-Json
    
    Invoke-RestMethod -Uri "$BaseUrl/groups/$($group.id)/expenses/" -Method Post -ContentType "application/json" -Body $expense1 | Out-Null
    Write-Host "✅ Added expense: Dinner at restaurant (`$120, paid by Alice, equal split)" -ForegroundColor Green
    
    # Percentage split expense
    $expense2 = @{
        description = "Hotel booking"
        amount = 300.0
        paid_by = $bob.id
        split_type = "percentage"
        splits = @(
            @{ user_id = $alice.id; percentage = 40.0 },
            @{ user_id = $bob.id; percentage = 30.0 },
            @{ user_id = $charlie.id; percentage = 30.0 }
        )
    } | ConvertTo-Json -Depth 3
    
    Invoke-RestMethod -Uri "$BaseUrl/groups/$($group.id)/expenses/" -Method Post -ContentType "application/json" -Body $expense2 | Out-Null
    Write-Host "✅ Added expense: Hotel booking (`$300, paid by Bob, percentage split)" -ForegroundColor Green
    
    return $group.id
}

# Function to check balances
function Get-Balances {
    param($GroupId)
    
    Write-Host ""
    Write-Host "💰 Checking balances..." -ForegroundColor Yellow
    
    Write-Host "Group balances:"
    $balances = Invoke-RestMethod -Uri "$BaseUrl/groups/$GroupId/balances" -Method Get
    $balances | ConvertTo-Json -Depth 4 | Write-Host
}

# Function to list all data
function Get-AllData {
    Write-Host ""
    Write-Host "📋 Current data summary..." -ForegroundColor Yellow
    
    Write-Host ""
    Write-Host "Users:"
    $users = Invoke-RestMethod -Uri "$BaseUrl/users/" -Method Get
    $users | ConvertTo-Json -Depth 2 | Write-Host
    
    Write-Host ""
    Write-Host "Groups:"
    $groups = Invoke-RestMethod -Uri "$BaseUrl/groups/" -Method Get
    $groups | ConvertTo-Json -Depth 3 | Write-Host
}

# Main execution
function Main {
    if (Test-Service) {
        $groupId = New-TestData
        Get-Balances -GroupId $groupId
        Get-AllData
        
        Write-Host ""
        Write-Host "🎉 Test completed successfully!" -ForegroundColor Green
        Write-Host ""
        Write-Host "You can now:" -ForegroundColor Cyan
        Write-Host "1. Visit http://localhost:3000 to use the web interface" -ForegroundColor White
        Write-Host "2. Visit http://localhost:8000/docs to see the API documentation" -ForegroundColor White
        Write-Host "3. Use the API endpoints directly" -ForegroundColor White
        Write-Host ""
        Write-Host "Expected balance results:" -ForegroundColor Cyan
        Write-Host "- Alice should be owed money (paid `$120, owes part of `$300)" -ForegroundColor White
        Write-Host "- Bob should have mixed balance (paid `$300, owes part of `$120)" -ForegroundColor White
        Write-Host "- Charlie should owe money (didn't pay anything)" -ForegroundColor White
    }
}

Main
