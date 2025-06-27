import os
import requests
from dotenv import load_dotenv

# Load environment variables from .env file
load_dotenv()

HUGGINGFACE_API_TOKEN = os.getenv("HUGGINGFACE_API_TOKEN")
# Use a more accessible model that works with basic API tokens
API_URL = "https://api-inference.huggingface.co/models/microsoft/DialoGPT-medium"

def get_ai_response(context: str, question: str) -> str:
    """
    Sends a formatted prompt to the Hugging Face API and returns the response.
    Falls back to a simple rule-based response if API fails.
    """
    if not HUGGINGFACE_API_TOKEN:
        return get_fallback_response(context, question)

    headers = {"Authorization": f"Bearer {HUGGINGFACE_API_TOKEN}"}

    # Create a simpler prompt for DialoGPT
    prompt = f"""Context: {context}

Question: {question}

Answer:"""

    payload = {
        "inputs": prompt,
        "parameters": {
            "max_length": 150,
            "temperature": 0.7,
            "do_sample": True,
            "return_full_text": False
        }
    }

    try:
        response = requests.post(API_URL, headers=headers, json=payload, timeout=30)
        
        # Check for a successful response
        if response.status_code == 200:
            response_data = response.json()
            # The response format can vary, so we check for common keys.
            if isinstance(response_data, list) and response_data:
                generated_text = response_data[0].get("generated_text")
                if generated_text:
                    return generated_text.strip()
            return "Sorry, I received an unexpected response format from the AI service."
        
        # Handle specific errors - fall back to rule-based response
        elif response.status_code == 401:
            return get_fallback_response(context, question)
        elif response.status_code == 403:
            return get_fallback_response(context, question)
        elif response.status_code == 503:
             return "Error: The AI model is currently loading and not available. Please try again in a few moments."
        else:
            # General error - fall back to rule-based response
            return get_fallback_response(context, question)

    except requests.exceptions.RequestException as e:
        return get_fallback_response(context, question)


def get_fallback_response(context: str, question: str) -> str:
    """
    Simple rule-based chatbot fallback when the AI API is not available.
    """
    question_lower = question.lower()
    
    # Check if question is related to the app
    app_keywords = ['user', 'group', 'expense', 'balance', 'settlement', 'owe', 'debt', 'money', 'split', 'bill', 'pay', 'member']
    is_app_related = any(keyword in question_lower for keyword in app_keywords)
    
    # If not app-related, provide contact information
    if not is_app_related:
        return ("I can only help with questions about users, groups, expenses, balances, and settlements in this Splitwise application. "
                "For other inquiries or complex questions, please contact us at:\n\n"
                "📧 Email: splitwise@gmail.com\n"
                "📞 Phone: 9876543214\n\n"
                "How can I help you with your expense management today?")
    
    # Count users
    if "how many users" in question_lower or "number of users" in question_lower:
        user_count = context.count("- ID:")
        return f"There are {user_count} users in the system."
    
    # Count groups
    elif "how many groups" in question_lower or "number of groups" in question_lower:
        group_count = context.count("- Group ID:")
        return f"There are {group_count} groups in the system."
    
    # List users
    elif "list users" in question_lower or "show users" in question_lower or "who are the users" in question_lower:
        lines = context.split('\n')
        users = [line.strip() for line in lines if line.strip().startswith("- ID:")]
        if users:
            return "Here are the users:\n" + "\n".join(users)
        return "No users found in the system."
    
    # List groups
    elif "list groups" in question_lower or "show groups" in question_lower or "what groups" in question_lower:
        lines = context.split('\n')
        groups = [line.strip() for line in lines if line.strip().startswith("- Group ID:")]
        if groups:
            return "Here are the groups:\n" + "\n".join(groups)
        return "No groups found in the system."
    
    # Balance information
    elif "balance" in question_lower or "owe" in question_lower or "debt" in question_lower:
        if "Expenses & Balances:" in context:
            balance_section = context.split("Expenses & Balances:")[1]
            return f"Here's the balance information:\n{balance_section.strip()}"
        return "No balance information available."
    
    # Help or general app questions
    elif "help" in question_lower or "what can you do" in question_lower or "how to" in question_lower:
        return ("I can help you with:\n"
                "• Viewing user information and counts\n"
                "• Checking group details and members\n"
                "• Reviewing expense balances and settlements\n"
                "• Understanding who owes what to whom\n\n"
                "Try asking: 'How many users are there?', 'List all groups', or 'Show me the balances'")
    
    # Default response for complex or unclear questions
    else:
        if len(question) > 100 or any(word in question_lower for word in ['complex', 'detailed', 'explain', 'algorithm', 'how does', 'why']):
            return ("This question seems complex and might require detailed assistance. "
                    "For comprehensive support, please contact us at:\n\n"
                    "📧 Email: splitwise@gmail.com\n"
                    "📞 Phone: 9876543214\n\n"
                    "I can help with basic questions about users, groups, expenses, and balances in this app.")
        else:
            return f"I can help you with information about users, groups, and balances. Here's what I found in the system:\n\n{context}"
