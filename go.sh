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

# Handler for SIGINT (Ctrl+C)
stop_servers() {
    echo "Stopping servers..."
    kill $PID_NPM
    # Send SIGTERM to Uvicorn to shut it down gracefully
    kill -TERM $PID_UVICORN
    exit
}

# Trap SIGINT (Ctrl+C) and call the handler function
# trap stop_servers SIGINT

# Start servers in the background and get their process IDs
start_uvicorn &
PID_UVICORN=$!
start_npm_dev &
PID_NPM=$!

# Wait for npm process to exit
wait $PID_NPM

# Kill all background processes when one of them exits
echo "Shutting down..."
kill $PID_UVICORN $PID_NPM
