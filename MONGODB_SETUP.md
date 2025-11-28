# MongoDB Atlas Setup Guide

## Steps to Connect to MongoDB Atlas

1. **Create a MongoDB Atlas Account** (if you don't have one)
   - Go to https://www.mongodb.com/cloud/atlas
   - Sign up for a free account

2. **Create a Cluster**
   - Click "Build a Database"
   - Choose the FREE tier (M0)
   - Select a cloud provider and region
   - Click "Create"

3. **Create a Database User**
   - Go to "Database Access" in the left sidebar
   - Click "Add New Database User"
   - Choose "Password" authentication
   - Enter a username and password (save these!)
   - Set privileges to "Atlas admin" or "Read and write to any database"
   - Click "Add User"

4. **Whitelist Your IP Address**
   - Go to "Network Access" in the left sidebar
   - Click "Add IP Address"
   - Click "Allow Access from Anywhere" (for development) or add your specific IP
   - Click "Confirm"

5. **Get Your Connection String**
   - Go to "Database" in the left sidebar
   - Click "Connect" on your cluster
   - Choose "Connect your application"
   - Copy the connection string (it looks like: `mongodb+srv://<username>:<password>@cluster0.xxxxx.mongodb.net/?retryWrites=true&w=majority`)

6. **Update Your .env File**
   - Replace `username` and `password` in the connection string with your database user credentials
   - Add your database name (e.g., `krishi-mithr`) before the `?` in the connection string
   - Example: `mongodb+srv://myuser:mypassword@cluster0.xxxxx.mongodb.net/krishi-mithr?retryWrites=true&w=majority`

7. **Update the .env file:**
   ```env
   DATABASE_URL="mongodb+srv://your-username:your-password@cluster0.xxxxx.mongodb.net/krishi-mithr?retryWrites=true&w=majority"
   ```

8. **Push the Schema to MongoDB:**
   ```bash
   npx prisma db push
   ```

9. **Restart your Next.js server:**
   ```bash
   npm run dev
   ```

## Important Notes

- **Never commit your .env file** to version control
- Keep your database password secure
- The connection string format is: `mongodb+srv://username:password@cluster.mongodb.net/database-name?retryWrites=true&w=majority`
- Make sure to URL-encode special characters in your password if needed



