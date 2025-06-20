# Splitwise Clone

A simplified expense splitting application built with FastAPI, React, and PostgreSQL. This application allows users to create groups, add expenses, and track who owes whom.

## Features

### Backend (FastAPI + PostgreSQL)
- **User Management**: Create and manage users
- **Group Management**: Create groups with multiple users
- **Expense Management**: Add expenses with equal or percentage-based splitting
- **Balance Tracking**: View balances for groups and individual users
- **AI Chatbot**: Natural language query interface powered by Hugging Face transformers
- **RESTful API**: Well-documented API endpoints

### Frontend (React + TailwindCSS)
- **User Interface**: Clean and modern UI built with TailwindCSS
- **Group Creation**: Create groups and add members
- **Expense Addition**: Add expenses with different split types
- **Balance Visualization**: View balances and who owes whom
- **AI Assistant**: Interactive chatbot for natural language queries about expenses
- **Responsive Design**: Works on desktop and mobile devices

## Quick Start

### Prerequisites
- Docker and Docker Compose
- Git

### Simple Setup (Recommended)

1. **Clone the repository**
   ```bash
   git clone https://github.com/Pavankishore9304/splitwise-clone.git
   cd splitwise-clone
   ```

2. **Start the application**
   ```bash
   docker-compose up --build
   ```

3. **Access the application**
   - Frontend: http://localhost:3000
   - Backend API: http://localhost:8000
   - API Documentation: http://localhost:8000/docs

That's it! The application will automatically:
- Start PostgreSQL database
- Run database migrations
- Build and start the FastAPI backend
- Build and start the React frontend

## AI Chatbot Features

The application includes an intelligent chatbot powered by Hugging Face transformers that can answer natural language questions about your expenses:

### Supported Queries
- **Balance Questions**: "How much does Alice owe?", "Who owes money?"
- **Expense Queries**: "Show me the latest 3 expenses", "What did we spend on groceries?"
- **Group Analysis**: "Who paid the most in Weekend Trip?", "What's the total spent?"
- **General Stats**: "What's our biggest expense?", "How many groups do we have?"

### How to Use
1. Click the floating chat button (💬 Ask AI) in the bottom-right corner
2. Type your question in natural language
3. Get instant answers about your expenses and balances

### AI Model Details
- **Primary Model**: Llama-3.1-8B-Instruct (Meta's latest instruction-tuned model)
- **Fallback Models**: DeepSeek-R1-0528, Microsoft DialoGPT-medium (for compatibility)
- **Processing**: Async processing for non-blocking responses
- **Context-Aware**: Uses your actual expense data for accurate answers

## Manual Setup (Development)

If you prefer to run components separately:

### 1. Database Setup
```bash
# Start PostgreSQL
docker run --name postgres-db -e POSTGRES_DB=splitwise -e POSTGRES_USER=postgres -e POSTGRES_PASSWORD=password -p 5432:5432 -d postgres:13

# Or use your local PostgreSQL instance
```

### 2. Backend Setup
```bash
cd backend
pip install -r requirements.txt
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

### 3. Frontend Setup
```bash
cd frontend
npm install
npm start
```

## API Documentation

### Core Endpoints

#### Users
- `POST /users/` - Create a new user
- `GET /users/` - List all users
- `GET /users/{user_id}` - Get user details

#### Groups
- `POST /groups/` - Create a new group
- `GET /groups/` - List all groups
- `POST /groups/{group_id}/members` - Add member to group
- `GET /groups/{group_id}/balances` - Get group balances

#### Expenses
- `POST /expenses/` - Create a new expense
- `GET /expenses/` - List all expenses
- `GET /expenses/{expense_id}` - Get expense details

#### AI Chatbot
- `POST /chat/query` - Send a natural language query to the AI chatbot

### Request/Response Examples

#### Create User
```bash
curl -X POST "http://localhost:8000/users/" \
  -H "Content-Type: application/json" \
  -d '{"name": "John Doe", "email": "john@example.com"}'
```

#### Create Group
```bash
curl -X POST "http://localhost:8000/groups/" \
  -H "Content-Type: application/json" \
  -d '{"name": "Weekend Trip", "description": "Trip to mountains"}'
```

#### Add Expense
```bash
curl -X POST "http://localhost:8000/expenses/" \
  -H "Content-Type: application/json" \
  -d '{
    "description": "Dinner at restaurant",
    "amount": 120.00,
    "paid_by": 1,
    "group_id": 1,
    "split_type": "equal",
    "splits": [
      {"user_id": 1, "amount": 40.00},
      {"user_id": 2, "amount": 40.00},
      {"user_id": 3, "amount": 40.00}
    ]
  }'
```

#### AI Chatbot Query
```bash
curl -X POST "http://localhost:8000/chat/query" \
  -H "Content-Type: application/json" \
  -d '{"query": "How much does Alice owe?"}'
```

For complete API documentation, visit: http://localhost:8000/docs

## Technology Stack

### Backend
- **FastAPI**: Modern Python web framework
- **SQLAlchemy**: SQL toolkit and ORM
- **PostgreSQL**: Reliable relational database
- **Alembic**: Database migration tool
- **Pydantic**: Data validation using Python type hints
- **Transformers**: Hugging Face transformers for AI chatbot
- **PyTorch**: Deep learning framework for model inference

### Frontend
- **React 18**: Modern JavaScript library
- **TypeScript**: Type-safe JavaScript
- **TailwindCSS**: Utility-first CSS framework
- **Axios**: HTTP client for API calls

### Infrastructure
- **Docker**: Containerization
- **Docker Compose**: Multi-container orchestration
- **Nginx**: Web server (for production)

## Project Structure

```
splitwise-clone/
├── backend/
│   ├── main.py              # FastAPI application entry point
│   ├── models.py            # SQLAlchemy database models
│   ├── schemas.py           # Pydantic models for validation
│   ├── database.py          # Database configuration
│   ├── chatbot.py           # AI chatbot implementation
│   ├── requirements.txt     # Python dependencies
│   └── Dockerfile           # Backend container configuration
├── frontend/
│   ├── src/
│   │   ├── components/      # React components
│   │   │   ├── ChatBot.tsx  # AI chatbot interface
│   │   │   ├── UserManagement.tsx
│   │   │   ├── GroupManagement.tsx
│   │   │   ├── ExpenseManagement.tsx
│   │   │   ├── BalanceView.tsx
│   │   │   └── SettlementManagement.tsx
│   │   ├── api/
│   │   │   └── index.ts     # API client configuration
│   │   ├── App.tsx          # Main application component
│   │   └── index.tsx        # Application entry point
│   ├── package.json         # Node.js dependencies
│   └── Dockerfile           # Frontend container configuration
├── docker-compose.yml       # Multi-container configuration
├── README.md               # Project documentation
└── .gitignore              # Git ignore patterns
```

## Database Schema

### Users Table
- `id`: Primary key
- `name`: User's full name
- `email`: User's email address

### Groups Table
- `id`: Primary key
- `name`: Group name
- `description`: Group description

### Group Members Table
- `group_id`: Foreign key to groups
- `user_id`: Foreign key to users

### Expenses Table
- `id`: Primary key
- `description`: Expense description
- `amount`: Total expense amount
- `paid_by`: Foreign key to users (who paid)
- `group_id`: Foreign key to groups
- `created_at`: Timestamp

### Expense Splits Table
- `id`: Primary key
- `expense_id`: Foreign key to expenses
- `user_id`: Foreign key to users
- `amount`: Amount owed by this user

## Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature-name`
3. Make your changes and commit: `git commit -m 'Add feature'`
4. Push to the branch: `git push origin feature-name`
5. Submit a pull request

## Environment Variables

### Backend (.env)
```env
DATABASE_URL=postgresql://postgres:password@localhost:5432/splitwise
CUDA_AVAILABLE=false  # Set to true if you have CUDA support for faster AI processing
```

### Frontend (.env)
```env
REACT_APP_API_URL=http://localhost:8000
```

## Assumptions Made

### Technical Assumptions
1. **Database**: PostgreSQL is available and accessible
2. **Environment**: Docker and Docker Compose are installed
3. **Network**: Default ports (3000, 8000, 5432) are available
4. **AI Model**: Internet connection required for initial model download
5. **Browser**: Modern browser with JavaScript enabled
6. **Memory**: Sufficient RAM for AI model inference (minimum 4GB recommended)

### Business Logic Assumptions
1. **Currency**: All amounts are in a single currency (no currency conversion)
2. **Splitting**: Equal splitting is the default, percentage-based splitting available
3. **Payments**: No actual payment processing (tracking only)
4. **Users**: No authentication system (simplified for demo)
5. **Groups**: Users can be in multiple groups
6. **Settlement**: Manual settlement tracking (no automated payments)
7. **AI Responses**: Chatbot provides informational responses only

### AI Chatbot Assumptions
1. **Model Availability**: Hugging Face models are accessible
2. **Fallback Strategy**: DialoGPT model used if DeepSeek fails
3. **Context Limitation**: Chatbot only knows about current expense data
4. **Response Format**: Text-only responses (no rich media)
5. **Language**: English language queries only
6. **Privacy**: No conversation history stored

## Troubleshooting

### Common Issues

1. **Port conflicts**: Change ports in docker-compose.yml if needed
2. **Database connection**: Ensure PostgreSQL is running and accessible
3. **AI Model Loading**: First startup may take longer due to model download
4. **Memory issues**: Increase Docker memory allocation for AI features
5. **CORS errors**: Check frontend API URL configuration

### AI-Specific Issues

1. **Model fails to load**: Check internet connection and available memory
2. **Slow responses**: Consider enabling CUDA if available
3. **Inaccurate responses**: Chatbot uses rule-based fallback for complex queries

## License

This project is open source and available under the [MIT License](LICENSE).

## Future Enhancements

### Planned Features
- User authentication and authorization
- Multi-currency support
- Receipt upload and OCR
- Advanced splitting options (custom percentages, shares)
- Email notifications
- Mobile app (React Native)
- Payment integration (Stripe, PayPal)
- Improved AI model with fine-tuning on expense data
- Voice input for chatbot
- Expense categories and analytics
- Export features (CSV, PDF)
- Multiple currencies
- Receipt upload
- Advanced splitting options
