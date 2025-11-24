#!/bin/bash

# Database reset script for CubeGame
# This script provides options to clean/reset the database

DB_NAME="socket_game_dev"
DB_USER=$(whoami)

echo "🧹 Database Reset Script"
echo "========================"
echo ""
echo "Database: $DB_NAME"
echo "User: $DB_USER"
echo ""
echo "Select an option:"
echo "1) Drop and recreate database (Complete reset - removes all data and schema)"
echo "2) Truncate all tables (Keep schema, remove all data)"
echo "3) Drop all tables and re-run migrations (Reset schema and data)"
echo ""
read -p "Enter choice [1-3]: " choice

case $choice in
  1)
    echo "⚠️  WARNING: This will DELETE ALL DATA!"
    read -p "Are you sure? Type 'yes' to continue: " confirm
    if [ "$confirm" = "yes" ]; then
      echo "🗑️  Dropping database..."
      export PATH="/opt/homebrew/opt/postgresql@15/bin:$PATH"
      dropdb $DB_NAME 2>/dev/null || echo "Database doesn't exist or already dropped"
      echo "✅ Database dropped"
      
      echo "🆕 Creating new database..."
      createdb $DB_NAME
      echo "✅ Database created"
      
      echo "🔄 Running migrations..."
      npm run db:migrate
      echo "✅ Database reset complete!"
    else
      echo "❌ Cancelled"
    fi
    ;;
  2)
    echo "🗑️  Truncating all tables..."
    export PATH="/opt/homebrew/opt/postgresql@15/bin:$PATH"
    psql -d $DB_NAME << EOF
TRUNCATE TABLE moves CASCADE;
TRUNCATE TABLE game_participants CASCADE;
TRUNCATE TABLE games CASCADE;
TRUNCATE TABLE notifications CASCADE;
-- Keep users table if you want to preserve user accounts
-- TRUNCATE TABLE users CASCADE;
EOF
    echo "✅ All tables truncated (users table preserved)"
    ;;
  3)
    echo "🗑️  Dropping all tables..."
    export PATH="/opt/homebrew/opt/postgresql@15/bin:$PATH"
    psql -d $DB_NAME << EOF
DROP TABLE IF EXISTS moves CASCADE;
DROP TABLE IF EXISTS game_participants CASCADE;
DROP TABLE IF EXISTS games CASCADE;
DROP TABLE IF EXISTS notifications CASCADE;
DROP TABLE IF EXISTS users CASCADE;
DROP TABLE IF EXISTS migrations CASCADE;
EOF
    echo "✅ All tables dropped"
    
    echo "🔄 Running migrations..."
    npm run db:migrate
    echo "✅ Database reset complete!"
    ;;
  *)
    echo "❌ Invalid choice"
    exit 1
    ;;
esac

