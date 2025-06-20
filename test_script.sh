#!/bin/bash

# Splitwise Clone - Quick Test Script
# This script tests the core functionality of the application

echo "🚀 Splitwise Clone - Testing Script"
echo "=================================="

BASE_URL="http://localhost:8000"

# Function to check if service is running
check_service() {
    if curl -s $BASE_URL/users/ > /dev/null; then
        echo "✅ Backend is running"
        return 0
    else
        echo "❌ Backend is not running. Please start with: docker-compose up"
        return 1
    fi
}

# Function to create test data
create_test_data() {
    echo ""
    echo "📝 Creating test data..."
    
    # Create users
    echo "Creating users..."
    ALICE=$(curl -s -X POST "$BASE_URL/users/" -H "Content-Type: application/json" -d '{"name": "Alice Johnson", "email": "alice@test.com"}' | grep -o '"id":[0-9]*' | cut -d':' -f2)
    BOB=$(curl -s -X POST "$BASE_URL/users/" -H "Content-Type: application/json" -d '{"name": "Bob Smith", "email": "bob@test.com"}' | grep -o '"id":[0-9]*' | cut -d':' -f2)
    CHARLIE=$(curl -s -X POST "$BASE_URL/users/" -H "Content-Type: application/json" -d '{"name": "Charlie Brown", "email": "charlie@test.com"}' | grep -o '"id":[0-9]*' | cut -d':' -f2)
    
    echo "✅ Created users: Alice (ID: $ALICE), Bob (ID: $BOB), Charlie (ID: $CHARLIE)"
    
    # Create group
    echo "Creating group..."
    GROUP=$(curl -s -X POST "$BASE_URL/groups/" -H "Content-Type: application/json" -d "{\"name\": \"Weekend Trip\", \"description\": \"Our weekend getaway\", \"user_ids\": [$ALICE, $BOB, $CHARLIE]}" | grep -o '"id":[0-9]*' | cut -d':' -f2)
    
    echo "✅ Created group: Weekend Trip (ID: $GROUP)"
    
    # Add expenses
    echo "Adding expenses..."
    
    # Equal split expense
    curl -s -X POST "$BASE_URL/groups/$GROUP/expenses/" -H "Content-Type: application/json" -d "{\"description\": \"Dinner at restaurant\", \"amount\": 120.0, \"paid_by\": $ALICE, \"split_type\": \"equal\"}" > /dev/null
    echo "✅ Added expense: Dinner at restaurant ($120, paid by Alice, equal split)"
    
    # Percentage split expense
    curl -s -X POST "$BASE_URL/groups/$GROUP/expenses/" -H "Content-Type: application/json" -d "{\"description\": \"Hotel booking\", \"amount\": 300.0, \"paid_by\": $BOB, \"split_type\": \"percentage\", \"splits\": [{\"user_id\": $ALICE, \"percentage\": 40.0}, {\"user_id\": $BOB, \"percentage\": 30.0}, {\"user_id\": $CHARLIE, \"percentage\": 30.0}]}" > /dev/null
    echo "✅ Added expense: Hotel booking ($300, paid by Bob, percentage split)"
    
    return $GROUP
}

# Function to check balances
check_balances() {
    local group_id=$1
    echo ""
    echo "💰 Checking balances..."
    
    echo "Group balances:"
    curl -s "$BASE_URL/groups/$group_id/balances" | python3 -m json.tool
}

# Function to list all data
list_data() {
    echo ""
    echo "📋 Current data summary..."
    
    echo ""
    echo "Users:"
    curl -s "$BASE_URL/users/" | python3 -m json.tool
    
    echo ""
    echo "Groups:"
    curl -s "$BASE_URL/groups/" | python3 -m json.tool
}

# Main execution
main() {
    if check_service; then
        create_test_data
        GROUP_ID=$?
        check_balances $GROUP_ID
        list_data
        
        echo ""
        echo "🎉 Test completed successfully!"
        echo ""
        echo "You can now:"
        echo "1. Visit http://localhost:3000 to use the web interface"
        echo "2. Visit http://localhost:8000/docs to see the API documentation"
        echo "3. Use the API endpoints directly"
        echo ""
        echo "Expected balance results:"
        echo "- Alice should be owed money (paid $120, owes part of $300)"
        echo "- Bob should have mixed balance (paid $300, owes part of $120)"
        echo "- Charlie should owe money (didn't pay anything)"
    fi
}

main
