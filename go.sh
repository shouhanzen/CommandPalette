#!/bin/bash
source backend/.venv/Scripts/activate

# Function to start Uvicorn server
start_uvicorn() {
    echo "Starting Uvicorn server..."
    cd backend
    uvicorn src.main:app --reload --port 8000
}

# Function to start npm dev server
start_npm_dev() {
    echo "Starting npm development server..."
    cd frontend
    npm run dev
}

# Trap SIGINT (Ctrl+C) and call the handler function
trap 'echo "Stopping servers..."; kill $PID_UVICORN $PID_NPM; exit' SIGINT

# Start servers in the background and get their process IDs
start_uvicorn &
PID_UVICORN=$!
start_npm_dev &
PID_NPM=$!

# Wait for any process to exit
wait -n

# Kill all background processes when one of them exits
echo "Shutting down..."
kill $PID_UVICORN $PID_NPM
