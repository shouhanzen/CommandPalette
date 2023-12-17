.PHONY: start_dev

backend:
	@echo "Starting backend server..."
	@cd backend && \
	source .venv/Scripts/activate && \
	uvicorn src.main:app --reload --port 8000

frontend:
	@echo "Activating virtual environment..."
	@source ../backend/.venv/Scripts/activate
	@echo "Starting npm development server..."
	@npm run dev

build:
	@echo "Building project..."
	@echo "Cleaning up prior artifacts"
	@cd backend && \
	rm -rf dist/*
	@cd frontend && \
	rm -rf dist/* out/*
	@rm -rf dist/*
	@echo "Building backend..."
	@cd backend && \
	source .venv/Scripts/activate && \
	make onefolder
	@echo "Building frontend..."
	@cd frontend && \
	npm run build
	@rm -rf dist && \
	mkdir dist && \
	cp -r frontend/dist/Palette*.exe dist/Palette_Setup.exe
	@echo "Build complete."