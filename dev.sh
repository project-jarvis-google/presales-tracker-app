#!/bin/bash

# --- Starting Fullstack Setup ---
LOG_FILE="debug.log"
echo "--- Starting Fullstack Setup: $(date) ---" | tee -a $LOG_FILE

# Function to clean up background processes on exit
cleanup() {
    echo -e "\nShutting down servers..." | tee -a $LOG_FILE
    kill $BACKEND_PID 2>/dev/null
    exit
}

# Trap SIGINT (Ctrl+C) and SIGTERM
trap cleanup SIGINT SIGTERM EXIT

echo "Cleaning up existing ports..." | tee -a $LOG_FILE
# More robust port clearing (works on macOS and Linux)
lsof -ti:8000,3000 | xargs kill -9 > /dev/null 2>&1
sleep 1 # Give the OS a second to release the sockets

# 1. Setup Backend
echo "[1/2] Starting Backend..." | tee -a $LOG_FILE

if [ -d "presales-backend" ]; then
    cd presales-backend
    if [ -d "venv" ]; then
        source venv/bin/activate
    else
        echo "Error: venv not found in presales-backend. Please create it." | tee -a ../$LOG_FILE
        exit 1
    fi

    # Install requirements silently in the background
    pip install -r requirements.txt >> ../$LOG_FILE 2>&1
    
    # Run uvicorn in the background
    uvicorn main:app --reload --host 127.0.0.1 --port 8000 >> ../$LOG_FILE 2>&1 &
    BACKEND_PID=$!
    cd ..
else
    echo "Error: Directory presales-backend not found." | tee -a $LOG_FILE
    exit 1
fi

# 2. Setup Frontend
echo "[2/2] Starting Frontend..." | tee -a $LOG_FILE
if [ -d "presales-ui" ]; then
    cd presales-ui
    
    # Fix: Removed the 'HOST=localhost' prefix to avoid the API schema error.
    # React-scripts handles localhost by default.
    npm start 2>&1 | tee -a ../$LOG_FILE
else
    echo "Error: Directory presales-ui not found." | tee -a $LOG_FILE
    kill $BACKEND_PID
    exit 1
fi