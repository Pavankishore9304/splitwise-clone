from fastapi import FastAPI, Depends, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from typing import List
from database import get_db, create_tables
import models
import schemas
from collections import defaultdict
from chatbot import chatbot
from pydantic import BaseModel

app = FastAPI(title="Splitwise Clone API", version="1.0.0")

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],  # React app URL
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Create tables on startup
@app.on_event("startup")
async def startup_event():
    create_tables()

# User endpoints
@app.post("/users/", response_model=schemas.User)
def create_user(user: schemas.UserCreate, db: Session = Depends(get_db)):
    db_user = models.User(**user.dict())
    db.add(db_user)
    db.commit()
    db.refresh(db_user)
    return db_user

@app.get("/users/", response_model=List[schemas.User])
def get_users(db: Session = Depends(get_db)):
    return db.query(models.User).all()

@app.get("/users/{user_id}", response_model=schemas.User)
def get_user(user_id: int, db: Session = Depends(get_db)):
    user = db.query(models.User).filter(models.User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return user

@app.delete("/users/{user_id}")
def delete_user(user_id: int, db: Session = Depends(get_db)):
    # Check if user exists
    user = db.query(models.User).filter(models.User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    # Check if user has any outstanding balances or is part of groups with expenses
    memberships = db.query(models.GroupMember).filter(models.GroupMember.user_id == user_id).all()
    
    for membership in memberships:
        # Check if there are any expenses in this group
        expenses = db.query(models.Expense).filter(models.Expense.group_id == membership.group_id).count()
        if expenses > 0:
            raise HTTPException(
                status_code=400, 
                detail=f"Cannot delete user. User is part of group '{membership.group.name}' which has expenses. Please settle all expenses first."
            )
    
    # Delete user's group memberships first
    db.query(models.GroupMember).filter(models.GroupMember.user_id == user_id).delete()
    
    # Delete the user
    db.delete(user)
    db.commit()
    
    return {"message": f"User '{user.name}' deleted successfully"}

# Group endpoints
@app.post("/groups/", response_model=schemas.Group)
def create_group(group: schemas.GroupCreate, db: Session = Depends(get_db)):
    # Create the group
    db_group = models.Group(name=group.name, description=group.description)
    db.add(db_group)
    db.commit()
    db.refresh(db_group)
    
    # Add members to the group
    for user_id in group.user_ids:
        # Check if user exists
        user = db.query(models.User).filter(models.User.id == user_id).first()
        if not user:
            raise HTTPException(status_code=404, detail=f"User with id {user_id} not found")
        
        # Create group membership
        membership = models.GroupMember(group_id=db_group.id, user_id=user_id)
        db.add(membership)
    
    db.commit()
    
    # Get group with proper member data
    group_with_members = db.query(models.Group).filter(models.Group.id == db_group.id).first()
    
    # Manually construct the response with user data
    members = []
    for membership in group_with_members.members:
        members.append(membership.user)
    
    # Create response object manually
    response_data = {
        "id": group_with_members.id,
        "name": group_with_members.name,
        "description": group_with_members.description,
        "created_at": group_with_members.created_at,
        "members": members
    }
    
    return response_data

@app.get("/groups/{group_id}", response_model=schemas.GroupDetails)
def get_group(group_id: int, db: Session = Depends(get_db)):
    group = db.query(models.Group).filter(models.Group.id == group_id).first()
    if not group:
        raise HTTPException(status_code=404, detail="Group not found")
    
    # Calculate total expenses
    total_expenses = db.query(models.Expense).filter(models.Expense.group_id == group_id).with_entities(
        models.Expense.amount
    ).all()
    total_amount = sum(expense.amount for expense in total_expenses)
    
    # Get members for the group
    members = []
    for membership in group.members:
        members.append(membership.user)
    
    # Create response object manually
    return {
        "id": group.id,
        "name": group.name,
        "description": group.description,
        "created_at": group.created_at,
        "members": members,
        "total_expenses": total_amount
    }

@app.get("/groups/", response_model=List[schemas.Group])
def get_groups(db: Session = Depends(get_db)):
    groups = db.query(models.Group).all()
    result = []
    
    for group in groups:
        # Get members for each group
        members = []
        for membership in group.members:
            members.append(membership.user)
        
        # Create response object manually
        group_data = {
            "id": group.id,
            "name": group.name,
            "description": group.description,
            "created_at": group.created_at,
            "members": members
        }
        result.append(group_data)
    
    return result

@app.delete("/groups/{group_id}")
def delete_group(group_id: int, db: Session = Depends(get_db)):
    # Check if group exists
    group = db.query(models.Group).filter(models.Group.id == group_id).first()
    if not group:
        raise HTTPException(status_code=404, detail="Group not found")
    
    # Check if there are any expenses in this group
    expenses_count = db.query(models.Expense).filter(models.Expense.group_id == group_id).count()
    if expenses_count > 0:
        raise HTTPException(
            status_code=400, 
            detail=f"Cannot delete group '{group.name}'. Group has {expenses_count} expenses. Please delete all expenses first or settle all balances."
        )
    
    # Delete group memberships first
    db.query(models.GroupMember).filter(models.GroupMember.group_id == group_id).delete()
    
    # Delete the group
    db.delete(group)
    db.commit()
    
    return {"message": f"Group '{group.name}' deleted successfully"}

# Expense endpoints
@app.post("/groups/{group_id}/expenses/", response_model=schemas.Expense)
def create_expense(group_id: int, expense: schemas.ExpenseCreate, db: Session = Depends(get_db)):
    # Check if group exists
    group = db.query(models.Group).filter(models.Group.id == group_id).first()
    if not group:
        raise HTTPException(status_code=404, detail="Group not found")
    
    # Check if paid_by user exists and is in the group
    paid_by_user = db.query(models.User).filter(models.User.id == expense.paid_by).first()
    if not paid_by_user:
        raise HTTPException(status_code=404, detail="Paying user not found")
    
    # Check if user is in the group
    membership = db.query(models.GroupMember).filter(
        models.GroupMember.group_id == group_id,
        models.GroupMember.user_id == expense.paid_by
    ).first()
    if not membership:
        raise HTTPException(status_code=400, detail="Paying user is not a member of this group")
    
    # Create expense
    db_expense = models.Expense(
        description=expense.description,
        amount=expense.amount,
        group_id=group_id,
        paid_by=expense.paid_by,
        split_type=expense.split_type
    )
    db.add(db_expense)
    db.commit()
    db.refresh(db_expense)
    
    # Create expense splits
    if expense.split_type == models.SplitType.EQUAL:
        # Split equally among all group members
        members = db.query(models.GroupMember).filter(models.GroupMember.group_id == group_id).all()
        split_amount = expense.amount / len(members)
        
        for member in members:
            split = models.ExpenseSplit(
                expense_id=db_expense.id,
                user_id=member.user_id,
                amount=split_amount
            )
            db.add(split)
    
    elif expense.split_type == models.SplitType.PERCENTAGE:
        # Split based on percentages
        if not expense.splits:
            raise HTTPException(status_code=400, detail="Percentage splits must be provided for percentage split type")
        
        # Validate percentages sum to 100
        total_percentage = sum(split.percentage for split in expense.splits)
        if abs(total_percentage - 100.0) > 0.01:  # Allow small floating point differences
            raise HTTPException(status_code=400, detail="Percentages must sum to 100")
        
        for split_data in expense.splits:
            # Check if user is in the group
            membership = db.query(models.GroupMember).filter(
                models.GroupMember.group_id == group_id,
                models.GroupMember.user_id == split_data.user_id
            ).first()
            if not membership:
                raise HTTPException(status_code=400, detail=f"User {split_data.user_id} is not a member of this group")
            
            split_amount = (split_data.percentage / 100.0) * expense.amount
            split = models.ExpenseSplit(
                expense_id=db_expense.id,
                user_id=split_data.user_id,
                amount=split_amount,
                percentage=split_data.percentage
            )
            db.add(split)
    
    db.commit()
    db.refresh(db_expense)
    return db_expense

@app.put("/expenses/{expense_id}", response_model=schemas.Expense)
def update_expense(expense_id: int, expense_update: schemas.ExpenseCreate, db: Session = Depends(get_db)):
    # Get the existing expense
    db_expense = db.query(models.Expense).filter(models.Expense.id == expense_id).first()
    if not db_expense:
        raise HTTPException(status_code=404, detail="Expense not found")
    
    # Check if the new paid_by user is in the group
    if expense_update.paid_by:
        membership = db.query(models.GroupMember).filter(
            models.GroupMember.group_id == db_expense.group_id,
            models.GroupMember.user_id == expense_update.paid_by
        ).first()
        if not membership:
            raise HTTPException(status_code=400, detail="The user who paid is not a member of this group")
    
    # Update basic expense fields
    if expense_update.description is not None:
        db_expense.description = expense_update.description
    if expense_update.amount is not None:
        db_expense.amount = expense_update.amount
    if expense_update.paid_by is not None:
        db_expense.paid_by = expense_update.paid_by
    
    # If splits are provided, update them
    if expense_update.splits:
        # Delete existing splits
        db.query(models.ExpenseSplit).filter(models.ExpenseSplit.expense_id == expense_id).delete()
        
        # Validate and create new splits
        if expense_update.split_type == "equal":
            # Equal split among all specified users
            split_amount = expense_update.amount / len(expense_update.splits)
            for split_data in expense_update.splits:
                # Check if user is in the group
                membership = db.query(models.GroupMember).filter(
                    models.GroupMember.group_id == db_expense.group_id,
                    models.GroupMember.user_id == split_data.user_id
                ).first()
                if not membership:
                    raise HTTPException(status_code=400, detail=f"User {split_data.user_id} is not a member of this group")
                
                split = models.ExpenseSplit(
                    expense_id=expense_id,
                    user_id=split_data.user_id,
                    amount=split_amount,
                    percentage=100.0 / len(expense_update.splits)
                )
                db.add(split)
        
        elif expense_update.split_type == "percentage":
            # Validate percentages sum to 100
            total_percentage = sum(split.percentage for split in expense_update.splits)
            if abs(total_percentage - 100.0) > 0.01:
                raise HTTPException(status_code=400, detail="Percentages must sum to 100")
            
            for split_data in expense_update.splits:
                # Check if user is in the group
                membership = db.query(models.GroupMember).filter(
                    models.GroupMember.group_id == db_expense.group_id,
                    models.GroupMember.user_id == split_data.user_id
                ).first()
                if not membership:
                    raise HTTPException(status_code=400, detail=f"User {split_data.user_id} is not a member of this group")
                
                split_amount = (split_data.percentage / 100.0) * expense_update.amount
                split = models.ExpenseSplit(
                    expense_id=expense_id,
                    user_id=split_data.user_id,
                    amount=split_amount,
                    percentage=split_data.percentage
                )
                db.add(split)
    
    db.commit()
    db.refresh(db_expense)
    return db_expense

@app.delete("/expenses/{expense_id}")
def delete_expense(expense_id: int, db: Session = Depends(get_db)):
    # Get the expense
    db_expense = db.query(models.Expense).filter(models.Expense.id == expense_id).first()
    if not db_expense:
        raise HTTPException(status_code=404, detail="Expense not found")
    
    # Delete expense splits first
    db.query(models.ExpenseSplit).filter(models.ExpenseSplit.expense_id == expense_id).delete()
    
    # Delete the expense
    db.delete(db_expense)
    db.commit()
    
    return {"detail": "Expense deleted successfully"}

@app.get("/groups/{group_id}/expenses/", response_model=List[schemas.Expense])
def get_group_expenses(group_id: int, db: Session = Depends(get_db)):
    # Check if group exists
    group = db.query(models.Group).filter(models.Group.id == group_id).first()
    if not group:
        raise HTTPException(status_code=404, detail="Group not found")
    
    return db.query(models.Expense).filter(models.Expense.group_id == group_id).all()

# Balance endpoints
@app.get("/groups/{group_id}/balances", response_model=schemas.GroupBalance)
def get_group_balances(group_id: int, db: Session = Depends(get_db)):
    # Check if group exists
    group = db.query(models.Group).filter(models.Group.id == group_id).first()
    if not group:
        raise HTTPException(status_code=404, detail="Group not found")
      # Get all group members
    members = db.query(models.GroupMember).filter(models.GroupMember.group_id == group_id).all()
    balances = []
    for member in members:
        user = member.user
        
        # Calculate how much this user owes (sum of their expense splits)
        owes = db.query(models.ExpenseSplit).join(models.Expense).filter(
            models.Expense.group_id == group_id,
            models.ExpenseSplit.user_id == user.id
        ).with_entities(models.ExpenseSplit.amount).all()
        total_owes = sum(split.amount for split in owes)
        
        # Calculate how much is owed to this user (expenses they paid minus their share)
        paid_expenses = db.query(models.Expense).filter(
            models.Expense.group_id == group_id,
            models.Expense.paid_by == user.id
        ).all()
        
        total_paid = sum(expense.amount for expense in paid_expenses)
        
        # Their share of expenses they paid
        their_share_of_paid = db.query(models.ExpenseSplit).join(models.Expense).filter(
            models.Expense.group_id == group_id,
            models.Expense.paid_by == user.id,
            models.ExpenseSplit.user_id == user.id
        ).with_entities(models.ExpenseSplit.amount).all()
        total_their_share = sum(split.amount for split in their_share_of_paid)
        
        owed_to_user = total_paid - total_their_share
        
        # Calculate settlements (payments made/received)
        settlements_made = db.query(models.Settlement).filter(
            models.Settlement.group_id == group_id,
            models.Settlement.payer_id == user.id
        ).with_entities(models.Settlement.amount).all()
        total_settlements_made = sum(settlement.amount for settlement in settlements_made)
        
        settlements_received = db.query(models.Settlement).filter(
            models.Settlement.group_id == group_id,
            models.Settlement.payee_id == user.id
        ).with_entities(models.Settlement.amount).all()
        total_settlements_received = sum(settlement.amount for settlement in settlements_received)
        
        # Adjust balances for settlements
        # If someone paid you (settlements_received), it reduces what they owe you
        # If you paid someone (settlements_made), it reduces what you owe them
        adjusted_owes = (total_owes - total_their_share) - total_settlements_made
        adjusted_owed = owed_to_user - total_settlements_received
        net_balance = adjusted_owed - adjusted_owes
        
        balance = schemas.Balance(
            user_id=user.id,
            user_name=user.name,
            owes=max(0, adjusted_owes),  # Ensure no negative values
            owed=max(0, adjusted_owed),
            net_balance=net_balance
        )
        balances.append(balance)
    
    return schemas.GroupBalance(
        group_id=group_id,
        group_name=group.name,
        balances=balances
    )

@app.get("/users/{user_id}/balances", response_model=schemas.UserBalance)
def get_user_balances(user_id: int, db: Session = Depends(get_db)):
    # Check if user exists
    user = db.query(models.User).filter(models.User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    # Get all groups the user is part of
    memberships = db.query(models.GroupMember).filter(models.GroupMember.user_id == user_id).all()
    
    group_balances = []
    total_net_balance = 0.0
    
    for membership in memberships:
        group_balance = get_group_balances(membership.group_id, db)
        
        # Find this user's balance in the group
        user_balance_in_group = next(
            (balance for balance in group_balance.balances if balance.user_id == user_id),
            None
        )
        
        if user_balance_in_group:
            total_net_balance += user_balance_in_group.net_balance
            group_balances.append(group_balance)
    
    return schemas.UserBalance(
        user_id=user_id,
        user_name=user.name,
        group_balances=group_balances,
        total_net_balance=total_net_balance
    )

# Settlement endpoints
@app.post("/groups/{group_id}/settlements/", response_model=schemas.Settlement)
def create_settlement(group_id: int, settlement: schemas.SettlementCreate, db: Session = Depends(get_db)):
    # Check if group exists
    group = db.query(models.Group).filter(models.Group.id == group_id).first()
    if not group:
        raise HTTPException(status_code=404, detail="Group not found")
    
    # Check if both users exist and are in the group
    payer = db.query(models.User).filter(models.User.id == settlement.payer_id).first()
    payee = db.query(models.User).filter(models.User.id == settlement.payee_id).first()
    
    if not payer:
        raise HTTPException(status_code=404, detail="Payer not found")
    if not payee:
        raise HTTPException(status_code=404, detail="Payee not found")
    
    # Check if both users are in the group
    payer_membership = db.query(models.GroupMember).filter(
        models.GroupMember.group_id == group_id,
        models.GroupMember.user_id == settlement.payer_id
    ).first()
    payee_membership = db.query(models.GroupMember).filter(
        models.GroupMember.group_id == group_id,
        models.GroupMember.user_id == settlement.payee_id
    ).first()
    
    if not payer_membership:
        raise HTTPException(status_code=400, detail="Payer is not a member of this group")
    if not payee_membership:
        raise HTTPException(status_code=400, detail="Payee is not a member of this group")
    
    if settlement.payer_id == settlement.payee_id:
        raise HTTPException(status_code=400, detail="Payer and payee cannot be the same person")
    
    if settlement.amount <= 0:
        raise HTTPException(status_code=400, detail="Settlement amount must be positive")
    
    # Create settlement record
    db_settlement = models.Settlement(
        group_id=group_id,
        payer_id=settlement.payer_id,
        payee_id=settlement.payee_id,
        amount=settlement.amount,
        description=settlement.description or f"{payer.name} paid {payee.name}"
    )
    
    db.add(db_settlement)
    db.commit()
    db.refresh(db_settlement)
    
    return db_settlement

@app.get("/groups/{group_id}/settlements/", response_model=List[schemas.Settlement])
def get_group_settlements(group_id: int, db: Session = Depends(get_db)):
    # Check if group exists
    group = db.query(models.Group).filter(models.Group.id == group_id).first()
    if not group:
        raise HTTPException(status_code=404, detail="Group not found")
    
    return db.query(models.Settlement).filter(models.Settlement.group_id == group_id).all()

@app.delete("/settlements/{settlement_id}")
def delete_settlement(settlement_id: int, db: Session = Depends(get_db)):
    # Find the settlement
    settlement = db.query(models.Settlement).filter(models.Settlement.id == settlement_id).first()
    if not settlement:
        raise HTTPException(status_code=404, detail="Settlement not found")
    
    # Delete the settlement
    db.delete(settlement)
    db.commit()
    
    return {"message": "Settlement deleted successfully"}

# Chatbot schemas
class ChatQuery(BaseModel):
    query: str

class ChatResponse(BaseModel):
    response: str
    query: str

# Chatbot endpoint
@app.post("/chat/query", response_model=ChatResponse)
async def chat_query(chat_query: ChatQuery, db: Session = Depends(get_db)):
    """
    Process natural language queries about expenses, balances, and groups
    Example queries:
    - "How much does Alice owe in group Goa Trip?"
    - "Show me my latest 3 expenses"
    - "Who paid the most in Weekend Trip?"
    """
    try:
        response = await chatbot.process_query(chat_query.query, db)
        return ChatResponse(response=response, query=chat_query.query)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error processing query: {str(e)}")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
