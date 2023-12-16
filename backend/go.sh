echo "Starting Uvicorn server..."

source secrets.sh
source .venv/Scripts/activate
uvicorn src.main:app --reload --port 8000
