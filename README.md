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
   git clone <repository-url>
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
- Start the FastAPI backend
- Start the React frontend

### Manual Setup (Development)

#### Backend Setup
1. **Navigate to backend directory**
   ```bash
   cd backend
   ```

2. **Install Python dependencies**
   ```bash
   pip install -r requirements.txt
   ```

3. **Set up PostgreSQL**
   - Install PostgreSQL
   - Create database: `splitwise_db`
   - Create user: `splitwise_user` with password: `password`

4. **Update environment variables**
   ```bash
   # Create .env file
   DATABASE_URL=postgresql://splitwise_user:password@localhost:5432/splitwise_db
   ```

5. **Run the backend**
   ```bash
   uvicorn main:app --reload
   ```

#### Frontend Setup
1. **Navigate to frontend directory**
   ```bash
   cd frontend
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Install TailwindCSS**
   ```bash
   npm install -D tailwindcss postcss autoprefixer
   ```

4. **Start the frontend**
   ```bash
   npm start
   ```

## API Documentation

### Users
- `POST /users/` - Create a new user
- `GET /users/` - Get all users
- `GET /users/{user_id}` - Get user by ID
- `GET /users/{user_id}/balances` - Get user's balances across all groups

### Groups
- `POST /groups/` - Create a new group
- `GET /groups/` - Get all groups
- `GET /groups/{group_id}` - Get group details
- `GET /groups/{group_id}/balances` - Get group balances
- `GET /groups/{group_id}/expenses/` - Get group expenses
- `POST /groups/{group_id}/expenses/` - Add expense to group

### Chatbot
- `POST /chat` - Query the AI assistant about expenses and balances

### Request/Response Examples

#### Create User
```json
POST /users/
{
  "name": "John Doe",
  "email": "john@example.com"
}
```

#### Create Group
```json
POST /groups/
{
  "name": "Weekend Trip",
  "description": "Our weekend getaway",
  "user_ids": [1, 2, 3]
}
```

#### Add Expense (Equal Split)
```json
POST /groups/1/expenses/
{
  "description": "Dinner at restaurant",
  "amount": 120.00,
  "paid_by": 1,
  "split_type": "equal"
}
```

#### Add Expense (Percentage Split)
```json
POST /groups/1/expenses/
{
  "description": "Hotel booking",
  "amount": 300.00,
  "paid_by": 2,
  "split_type": "percentage",
  "splits": [
    {"user_id": 1, "percentage": 40.0},
    {"user_id": 2, "percentage": 30.0},
    {"user_id": 3, "percentage": 30.0}
  ]
}
```

## How to Use

### 1. Create Users
- Go to the "Users" tab
- Click "Add User"
- Enter name and email
- Create all users who will participate in expense splitting

### 2. Create Groups
- Go to the "Groups" tab
- Click "Create Group"
- Enter group name and description
- Select members from the user list
- Click "Create Group"

### 3. Add Expenses
- Go to the "Expenses" tab
- Select a group
- Click "Add Expense"
- Enter expense details:
  - Description (e.g., "Dinner", "Hotel")
  - Amount
  - Who paid
  - Split type (Equal or Percentage)
  - For percentage splits, specify each person's percentage

### 4. View Balances
- Go to the "Balances" tab
- Choose between Group View or User View
- **Group View**: See who owes whom within a specific group
- **User View**: See a user's overall balance across all groups

### 5. Use AI Chatbot
- Click the floating "💬 Ask AI" button in the bottom-right corner
- Ask natural language questions about your expenses:
  - "How much does Alice owe?"
  - "Show me the latest 3 expenses"
  - "Who paid the most in Weekend Trip?"
  - "What's the total spent?"
- The AI assistant uses Hugging Face transformers to understand and respond to your queries

## Testing & Debugging

### Test the Application

1. **Create Test Data**
   ```bash
   # Create users
   curl -X POST "http://localhost:8000/users/" \
        -H "Content-Type: application/json" \
        -d '{"name": "Alice", "email": "alice@example.com"}'
   
   curl -X POST "http://localhost:8000/users/" \
        -H "Content-Type: application/json" \
        -d '{"name": "Bob", "email": "bob@example.com"}'
   ```

2. **Create a Group**
   ```bash
   curl -X POST "http://localhost:8000/groups/" \
        -H "Content-Type: application/json" \
        -d '{"name": "Test Group", "user_ids": [1, 2]}'
   ```

3. **Add an Expense**
   ```bash
   curl -X POST "http://localhost:8000/groups/1/expenses/" \
        -H "Content-Type: application/json" \
        -d '{"description": "Test Expense", "amount": 50.0, "paid_by": 1, "split_type": "equal"}'
   ```

4. **Check Balances**
   ```bash
   curl "http://localhost:8000/groups/1/balances"
   ```

### Debug Common Issues

1. **Database Connection Issues**
   - Check if PostgreSQL is running
   - Verify connection string in `.env` file
   - Ensure database and user exist

2. **CORS Issues**
   - Backend includes CORS middleware for `http://localhost:3000`
   - Check if frontend is running on port 3000

3. **API Errors**
   - Check backend logs: `docker-compose logs backend`
   - Visit API docs: http://localhost:8000/docs
   - Verify request format matches schema

4. **Frontend Issues**
   - Check frontend logs: `docker-compose logs frontend`
   - Verify backend is running on port 8000
   - Check browser console for errors

### Development Workflow

1. **Make Changes**
   - Backend: Edit files in `./backend/` - auto-reloads
   - Frontend: Edit files in `./frontend/src/` - auto-reloads

2. **View Logs**
   ```bash
   docker-compose logs -f backend
   docker-compose logs -f frontend
   docker-compose logs -f postgres
   ```

3. **Restart Services**
   ```bash
   docker-compose restart backend
   docker-compose restart frontend
   ```

4. **Reset Database**
   ```bash
   docker-compose down -v
   docker-compose up --build
   ```

## Project Structure

```
splitwise-clone/
├── backend/
│   ├── main.py           # FastAPI application
│   ├── models.py         # SQLAlchemy models
│   ├── schemas.py        # Pydantic schemas
│   ├── database.py       # Database configuration
│   ├── chatbot.py        # AI chatbot with Hugging Face integration
│   ├── requirements.txt  # Python dependencies
│   └── Dockerfile        # Backend Docker config
├── frontend/
│   ├── src/
│   │   ├── components/   # React components
│   │   │   ├── ChatBot.tsx  # AI chatbot interface
│   │   │   └── ...       # Other components
│   │   ├── api/          # API service
│   │   └── App.tsx       # Main App component
│   ├── package.json      # Node.js dependencies
│   └── Dockerfile        # Frontend Docker config
├── docker-compose.yml    # Full stack setup
└── README.md            # This file
```

## Assumptions Made

1. **No Authentication**: Users are identified by ID only
2. **No Payment Processing**: Only tracks who owes whom
3. **Simple User Model**: Users only have name and email
4. **In-Memory Session**: No persistent user sessions
5. **Basic Validation**: Minimal input validation
6. **Equal Split Default**: When no percentages provided
7. **USD Currency**: All amounts assumed to be in USD
8. **AI Model Fallback**: If DeepSeek model fails to load, falls back to DialoGPT-medium or rule-based responses
9. **English Language**: Chatbot responses are in English only

## Technologies Used

- **Backend**: Python, FastAPI, SQLAlchemy, PostgreSQL, Hugging Face Transformers
- **Frontend**: React, TypeScript, TailwindCSS, Axios
- **AI/ML**: Hugging Face Transformers (DeepSeek-R1-0528, DialoGPT-medium)
- **Database**: PostgreSQL
- **Containerization**: Docker, Docker Compose

## Future Enhancements

- User authentication and sessions
- Settlement/payment tracking
- Email notifications
- Export functionality
- Mobile app
- Multiple currencies
- Receipt upload
- Advanced splitting options
