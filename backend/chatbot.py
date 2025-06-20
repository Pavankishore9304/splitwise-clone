import os
import json
from typing import List, Dict, Any
from transformers import pipeline
from sqlalchemy.orm import Session
from database import get_db
import models
from collections import defaultdict
import asyncio
import logging

# Set up logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class ExpenseChatbot:
    def __init__(self):
        try:
            logger.info("Initializing AI transformer model...")
            # Try to initialize the Hugging Face pipeline with Llama model
            try:
                logger.info("Attempting to load Llama-3.1-8B-Instruct model...")
                from transformers import AutoTokenizer, AutoModelForCausalLM
                
                # Load Llama model and tokenizer
                self.tokenizer = AutoTokenizer.from_pretrained("meta-llama/Llama-3.1-8B-Instruct")
                self.model = AutoModelForCausalLM.from_pretrained(
                    "meta-llama/Llama-3.1-8B-Instruct",
                    device_map="auto" if os.getenv("CUDA_AVAILABLE") else "cpu",
                    torch_dtype="auto"
                )
                
                # Create pipeline
                self.pipe = pipeline(
                    "text-generation", 
                    model=self.model,
                    tokenizer=self.tokenizer,
                    device_map="auto" if os.getenv("CUDA_AVAILABLE") else "cpu"
                )
                logger.info("Llama-3.1-8B-Instruct model loaded successfully!")
                
            except Exception as model_error:
                logger.warning(f"Llama model failed to load: {model_error}")
                logger.info("Trying DeepSeek model as fallback...")
                try:
                    self.pipe = pipeline(
                        "text-generation", 
                        model="deepseek-ai/DeepSeek-R1-0528", 
                        trust_remote_code=True,
                        device_map="auto" if os.getenv("CUDA_AVAILABLE") else "cpu"
                    )
                    logger.info("DeepSeek model loaded successfully!")
                except Exception as deepseek_error:
                    logger.warning(f"DeepSeek model failed to load: {deepseek_error}")
                    logger.info("Trying DialoGPT as final fallback...")
                    # Fallback to a simpler model that doesn't require special dependencies
                    self.pipe = pipeline(
                        "text-generation", 
                        model="microsoft/DialoGPT-medium", 
                        trust_remote_code=False
                    )
                    logger.info("DialoGPT model loaded successfully!")
            
            self.model_available = True
        except Exception as e:
            logger.error(f"Failed to load any transformer model: {e}")
            logger.info("Falling back to rule-based responses")
            self.pipe = None
            self.model_available = False
    
    def get_context_data(self, db: Session) -> Dict[str, Any]:
        """Get structured data from database for context"""
        # Get all users
        users = db.query(models.User).all()
        users_data = [{"id": u.id, "name": u.name, "email": u.email} for u in users]
        
        # Get all groups with members
        groups = db.query(models.Group).all()
        groups_data = []
        for group in groups:
            group_data = {
                "id": group.id,
                "name": group.name,
                "members": [{"id": m.user.id, "name": m.user.name} for m in group.members]
            }
            groups_data.append(group_data)
        
        # Get all expenses with details
        expenses = db.query(models.Expense).all()
        expenses_data = []
        for expense in expenses:
            expense_data = {
                "id": expense.id,
                "description": expense.description,
                "amount": float(expense.amount),
                "paid_by": {"id": expense.paid_by_user.id, "name": expense.paid_by_user.name},
                "group": {"id": expense.group.id, "name": expense.group.name},
                "created_at": expense.created_at.isoformat(),
                "splits": [
                    {
                        "user": {"id": split.user.id, "name": split.user.name},
                        "amount": float(split.amount)
                    }
                    for split in expense.splits
                ]
            }
            expenses_data.append(expense_data)
        
        # Calculate balances
        balances = self.calculate_balances(expenses_data)
        
        return {
            "users": users_data,
            "groups": groups_data,
            "expenses": expenses_data,
            "balances": balances
        }
    
    def calculate_balances(self, expenses_data: List[Dict]) -> Dict[str, Dict]:
        """Calculate user balances from expenses"""
        balances = defaultdict(lambda: defaultdict(float))
        
        for expense in expenses_data:
            paid_by_id = expense["paid_by"]["id"]
            paid_by_name = expense["paid_by"]["name"]
            amount = expense["amount"]
            
            for split in expense["splits"]:
                user_id = split["user"]["id"]
                user_name = split["user"]["name"]
                split_amount = split["amount"]
                
                if user_id != paid_by_id:
                    # User owes money to the person who paid
                    balances[user_name][paid_by_name] += split_amount
                else:
                    # Person who paid gets credit for others' shares
                    balances[paid_by_name]["total_paid"] = balances[paid_by_name].get("total_paid", 0) + amount
                    balances[paid_by_name]["own_share"] = balances[paid_by_name].get("own_share", 0) + split_amount
        
        return dict(balances)
    
    def simple_query_handler(self, query: str, context_data: Dict[str, Any]) -> str:
        """Simple rule-based query handler when OpenAI is not available"""
        query_lower = query.lower()
        
        # Handle balance queries
        if "owe" in query_lower or "owes" in query_lower:
            # Extract user name (simple approach)
            for user in context_data["users"]:
                if user["name"].lower() in query_lower:
                    user_name = user["name"]
                    balances = context_data["balances"].get(user_name, {})
                    if balances:
                        total_owed = sum(amount for key, amount in balances.items() if key != "total_paid" and key != "own_share")
                        return f"{user_name} owes a total of ${total_owed:.2f}"
                    else:
                        return f"{user_name} doesn't owe anything currently."
        
        # Handle latest expenses
        if "latest" in query_lower and "expense" in query_lower:
            expenses = context_data["expenses"]
            if expenses:
                # Sort by created_at and get latest 3
                sorted_expenses = sorted(expenses, key=lambda x: x["created_at"], reverse=True)[:3]
                result = "Latest 3 expenses:\n"
                for exp in sorted_expenses:
                    result += f"• {exp['description']}: ${exp['amount']:.2f} paid by {exp['paid_by']['name']}\n"
                return result
            else:
                return "No expenses found."
          # Handle who paid most
        if "paid the most" in query_lower or "paid most" in query_lower:
            user_payments = defaultdict(float)
            for expense in context_data["expenses"]:
                user_payments[expense["paid_by"]["name"]] += expense["amount"]
            
            if user_payments:
                top_payer = max(user_payments.items(), key=lambda x: x[1])
                return f"{top_payer[0]} paid the most with ${top_payer[1]:.2f}"
            else:
                return "No expenses found."
        
        return "I'm sorry, I couldn't understand your query. Try asking about balances, latest expenses, or who paid the most."
    
    async def process_query(self, query: str, db: Session) -> str:
        """Process user query and return response"""
        try:
            # Get context data
            context_data = self.get_context_data(db)
            
            # If no model available, use simple handler
            if not self.model_available or not self.pipe:
                return self.simple_query_handler(query, context_data)
            
            # Prepare context for the model
            context_summary = self.prepare_context_summary(context_data)
            
            # Prepare messages for the model
            messages = [
                {
                    "role": "system", 
                    "content": f"""You are a helpful assistant for a Splitwise-like expense sharing app. 
Answer user queries about expenses, balances, and group spending using the provided data.
Be concise, friendly, and accurate with numbers.

Current Data Summary:
{context_summary}

Format monetary amounts with $ symbol and 2 decimal places.
If asked about specific users or groups, make sure they exist in the data.
Keep responses under 200 words and be direct."""
                },
                {
                    "role": "user", 
                    "content": query
                }
            ]
            
            # Generate response using DeepSeek model
            logger.info(f"Processing query with DeepSeek: {query}")
            
            # Run the pipeline in a thread to avoid blocking
            loop = asyncio.get_event_loop()
            response = await loop.run_in_executor(
                None, 
                lambda: self.pipe(
                    messages, 
                    max_new_tokens=200, 
                    temperature=0.7,
                    do_sample=True,
                    return_full_text=False
                )
            )
            
            # Extract the generated text
            if response and len(response) > 0:
                generated_text = response[0].get('generated_text', '').strip()
                if generated_text:
                    return generated_text
            
            # Fallback if generation fails
            return self.simple_query_handler(query, context_data)
            
        except Exception as e:
            logger.error(f"Error processing query with DeepSeek: {e}")
            # Fallback to simple handler
            context_data = self.get_context_data(db)
            return self.simple_query_handler(query, context_data)
    
    def prepare_context_summary(self, context_data: Dict[str, Any]) -> str:
        """Prepare a concise context summary for the model"""
        summary = []
        
        # Users summary
        users = context_data.get("users", [])
        if users:
            user_names = [u["name"] for u in users]
            summary.append(f"Users: {', '.join(user_names)}")
        
        # Groups summary
        groups = context_data.get("groups", [])
        if groups:
            group_info = [f"{g['name']} ({len(g['members'])} members)" for g in groups]
            summary.append(f"Groups: {', '.join(group_info)}")
        
        # Expenses summary
        expenses = context_data.get("expenses", [])
        if expenses:
            total_expenses = len(expenses)
            total_amount = sum(e["amount"] for e in expenses)
            recent_expenses = sorted(expenses, key=lambda x: x["created_at"], reverse=True)[:3]
            summary.append(f"Total expenses: {total_expenses} (${total_amount:.2f})")
            
            if recent_expenses:
                recent_info = []
                for exp in recent_expenses:
                    recent_info.append(f"{exp['description']}: ${exp['amount']:.2f} by {exp['paid_by']['name']}")
                summary.append(f"Recent: {'; '.join(recent_info)}")
        
        # Balances summary
        balances = context_data.get("balances", {})
        if balances:
            balance_info = []
            for user, user_balances in balances.items():
                if isinstance(user_balances, dict):
                    total_owed = sum(amount for key, amount in user_balances.items() 
                                   if key not in ["total_paid", "own_share"] and isinstance(amount, (int, float)))
                    if total_owed > 0:
                        balance_info.append(f"{user} owes ${total_owed:.2f}")
            
            if balance_info:
                summary.append(f"Balances: {'; '.join(balance_info)}")
        
        return "\n".join(summary)

# Global chatbot instance
chatbot = ExpenseChatbot()
