> debug.log

echo "--- Starting Fullstack Setup: $(date) ---" | tee -a debug.log
echo "Cleaning up existing ports..." | tee -a debug.log
lsof -ti:8000 | xargs kill -9 > /dev/null 2>&1
lsof -ti:3000 | xargs kill -9 > /dev/null 2>&1

# 1. Setup Backend
echo "[1/2] Starting Backend..." | tee -a debug.log

cd presales-backend
if [ -d "venv" ]; then
    source venv/bin/activate
else
    echo "Error: venv not found. Please create it." | tee -a ../debug.log
    exit 1
fi

pip install -r requirements.txt >> ../debug.log 2>&1
uvicorn main:app --reload --host 127.0.0.1 --port 8000 2>&1 | tee -a ../debug.log &
BACKEND_PID=$!

# 2. Setup Frontend
echo "[2/2] Starting Frontend..." | tee -a debug.log
cd ../presales-ui
HOST=localhost npm start 2>&1 | tee -a ../debug.log
trap "kill $BACKEND_PID" EXIT