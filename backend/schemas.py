from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime
from models import SplitType

# User schemas
class UserBase(BaseModel):
    name: str
    email: str

class UserCreate(UserBase):
    pass

class User(UserBase):
    id: int
    created_at: datetime
    
    class Config:
        from_attributes = True

# Group schemas
class GroupBase(BaseModel):
    name: str
    description: Optional[str] = None

class GroupCreate(GroupBase):
    user_ids: List[int]

class Group(GroupBase):
    id: int
    created_at: datetime
    members: List[User] = []
    
    class Config:
        from_attributes = True

class GroupDetails(Group):
    total_expenses: float

# Expense schemas
class ExpenseSplitCreate(BaseModel):
    user_id: int
    percentage: Optional[float] = None  # Only for percentage splits

class ExpenseCreate(BaseModel):
    description: str
    amount: float
    paid_by: int
    split_type: SplitType
    splits: Optional[List[ExpenseSplitCreate]] = None  # Only for percentage splits

class ExpenseSplit(BaseModel):
    id: int
    user_id: int
    amount: float
    percentage: Optional[float] = None
    user: User
    
    class Config:
        from_attributes = True

class Expense(BaseModel):
    id: int
    description: str
    amount: float
    paid_by: int
    split_type: SplitType
    created_at: datetime
    paid_by_user: User
    splits: List[ExpenseSplit] = []
    
    class Config:
        from_attributes = True

# Balance schemas
class Balance(BaseModel):
    user_id: int
    user_name: str
    owes: float  # Amount this user owes
    owed: float  # Amount owed to this user
    net_balance: float  # Positive means they are owed money, negative means they owe money

class GroupBalance(BaseModel):
    group_id: int
    group_name: str
    balances: List[Balance]

class UserBalance(BaseModel):
    user_id: int
    user_name: str
    group_balances: List[GroupBalance]
    total_net_balance: float

# Settlement schemas
class SettlementCreate(BaseModel):
    payer_id: int  # Who is paying
    payee_id: int  # Who is receiving the payment
    amount: float
    description: Optional[str] = None

class Settlement(BaseModel):
    id: int
    group_id: int
    payer_id: int
    payee_id: int
    amount: float
    description: Optional[str]
    settled_at: datetime
    payer: User
    payee: User
    
    class Config:
        from_attributes = True
