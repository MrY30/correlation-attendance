# Setup Guide for Correlation Attendance App

## Prerequisites
- Node.js installed (version 16 or higher)
- A Supabase account and project

## Step 1: Install Dependencies
```bash
npm install
```

## Step 2: Configure Supabase

### Get Your Supabase Credentials
1. Go to [supabase.com](https://supabase.com) and sign in
2. Create a new project or select an existing one
3. Go to **Settings** → **API**
4. Copy the following values:
   - **Project URL** (looks like: `https://abcdefghijklmnop.supabase.co`)
   - **service_role key** (starts with `eyJ...`)

### Create Environment File
Create a `.env` file in your project root with:
```env
SUPABASE_URL=https://your-project-id.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key-here
```

**⚠️ Important:** Never commit your `.env` file to version control!

## Step 3: Set Up Database Table

### Create the Sessions Table
In your Supabase dashboard, go to **SQL Editor** and run:

```sql
CREATE TABLE IF NOT EXISTS sessions (
  id SERIAL PRIMARY KEY,
  session_name VARCHAR(255) NOT NULL,
  session_id VARCHAR(100) UNIQUE NOT NULL,
  open_date TIMESTAMP WITH TIME ZONE NOT NULL,
  close_date TIMESTAMP WITH TIME ZONE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create an index for better performance
CREATE INDEX IF NOT EXISTS idx_sessions_session_id ON sessions(session_id);
CREATE INDEX IF NOT EXISTS idx_sessions_open_date ON sessions(open_date);
```

## Step 4: Start the Application

### Development Mode
```bash
npm start
```

The server will start on `http://localhost:3000`

### Check Health Status
Visit `http://localhost:3000/api/health` to verify:
- Server is running
- Database connection is working

## Step 5: Test the Application

1. Open `http://localhost:3000/MCMAdmin` in your browser
2. Click "Add Session" button
3. Fill in the session details
4. Submit the form

## Troubleshooting

### Common Issues

#### 1. "Missing Supabase environment variables"
- Check that your `.env` file exists and has the correct values
- Restart the server after creating/modifying the `.env` file

#### 2. "Sessions table does not exist"
- Run the SQL command above to create the table
- Check that you're in the correct database schema

#### 3. "Connection failed"
- Verify your Supabase URL and service role key
- Check that your Supabase project is active
- Ensure your IP is not blocked by Supabase

#### 4. "Session ID already exists"
- Use a unique session ID for each session
- Check existing sessions in your Supabase dashboard

### Debug Mode
The application now provides detailed error messages. Check your terminal for:
- Connection status
- Detailed error logs
- Request/response information

## File Structure
```
src/
├── backend/
│   ├── index.js          # Main server file
│   ├── lib/
│   │   └── supabaseClient.js  # Database connection
│   └── routes/
│       ├── sessions.js   # Session management
│       └── students.js   # Student management
└── frontend/
    ├── pages/            # HTML pages
    ├── js/              # JavaScript files
    └── css/             # Stylesheets
```

## Support
If you continue to have issues:
1. Check the terminal for error messages
2. Verify your Supabase credentials
3. Test the health endpoint: `/api/health`
4. Check that all required tables exist in your database
