#!/bin/bash

# KennyGames Party - Database Setup Script
# This script helps you deploy the multiplayer schema to Supabase

echo "🎮 KennyGames Party - Database Setup"
echo "===================================="
echo ""
echo "📋 Steps to deploy:"
echo ""
echo "1. Go to your Supabase Dashboard:"
echo "   https://supabase.com/dashboard/project/zwzfoullsgqrnwfwdtyk"
echo ""
echo "2. Navigate to: SQL Editor > New Query"
echo ""
echo "3. Copy the content of this file:"
echo "   supabase/migrations/001_multiplayer_games.sql"
echo ""
echo "4. Paste it in the SQL Editor"
echo ""
echo "5. Click 'Run' button"
echo ""
echo "✅ Done! Your database will have these new tables:"
echo "   - party_games"
echo "   - party_game_players"
echo "   - party_game_state"
echo ""
echo "🔗 Or use Supabase CLI (if installed):"
echo "   supabase db push"
echo ""
read -p "Press Enter to open the migration file..."
cat supabase/migrations/001_multiplayer_games.sql
