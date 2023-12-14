echo "Starting Uvicorn server..."

cd backend
source .venv/Scripts/activate
uvicorn src.main:app --reload --port 8000
