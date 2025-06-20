# Deployment Instructions

## Push to GitHub

### Step 1: Create GitHub Repository
1. Go to [GitHub.com](https://github.com)
2. Click "New repository" (+ icon)
3. Name your repository: `splitwise-clone-ai`
4. Add description: "Expense splitting app with AI chatbot powered by Hugging Face transformers"
5. Keep it **Public** (recommended for portfolio)
6. **Don't** initialize with README, .gitignore, or license (we already have these)
7. Click "Create repository"

### Step 2: Push Your Code
Copy and run these commands in your terminal:

```bash
# Navigate to your project directory
cd "d:\PAVAN\intern_task\splitwise-clone"

# Add your GitHub repository as origin
git remote add origin https://github.com/Pavankishore9304/splitwise-clone.git

# Verify the remote was added
git remote -v

# Push to GitHub
git branch -M main
git push -u origin main
```

### Step 3: Verify Upload
1. Go to your GitHub repository
2. You should see all files including:
   - ✅ backend/ (FastAPI app)
   - ✅ frontend/ (React app)
   - ✅ docker-compose.yml (full stack setup)
   - ✅ README.md (complete documentation)
   - ✅ .gitignore (proper exclusions)

## Alternative: Using GitHub CLI

If you have GitHub CLI installed:

```bash
cd "d:\PAVAN\intern_task\splitwise-clone"

# Create repository and push
gh repo create splitwise-clone --public --description "Expense splitting app with AI chatbot"
git remote add origin https://github.com/Pavankishore9304/splitwise-clone.git
git branch -M main
git push -u origin main
```

## After Pushing

### Update README
1. Edit the README.md on GitHub or locally
2. Replace `<repository-url>` with your actual GitHub repository URL:
   ```
   git clone https://github.com/YOUR_USERNAME/splitwise-clone-ai.git
   ```

### Enable GitHub Pages (Optional)
1. Go to repository Settings
2. Scroll to "Pages"
3. Select source: "Deploy from a branch"
4. Choose "main" branch
5. This will create a live demo URL

## Repository Features to Enable

### 1. Add Topics/Tags
Go to repository main page → About section → Settings gear → Add topics:
- `expense-splitting`
- `fastapi`
- `react`
- `artificial-intelligence`
- `huggingface-transformers`
- `docker`
- `postgresql`
- `fullstack`

### 2. Repository Description
"Full-stack expense splitting application with AI chatbot. Built with FastAPI, React, PostgreSQL, and Hugging Face transformers for natural language queries."

### 3. Website URL
Add your deployment URL (if you deploy to Heroku, Railway, etc.)

## Deployment Options

### 1. Local Development
```bash
git clone https://github.com/Pavankishore9304/splitwise-clone.git
cd splitwise-clone
docker-compose up --build
```

### 2. Railway (Recommended for free hosting)
1. Connect your GitHub repository to Railway
2. Deploy using the provided docker-compose.yml
3. Add environment variables as needed

### 3. Heroku (with separate dynos)
- Deploy backend and frontend as separate Heroku apps
- Use Heroku PostgreSQL add-on

### 4. DigitalOcean App Platform
- Deploy directly from GitHub
- Auto-deployments on push

## Security Notes

Before deploying to production:
1. Remove any hardcoded credentials
2. Use environment variables for sensitive data
3. Add proper CORS settings
4. Implement rate limiting
5. Add authentication if needed
