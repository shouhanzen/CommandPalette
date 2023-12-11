echo "Starting Uvicorn server..."
cd backend
uvicorn src.main:app --reload --port 8000
