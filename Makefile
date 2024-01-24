.PHONY: start_dev backend frontend build create_venv frontend_controls_backend

BACKEND_PATH = backend
FRONTEND_PATH = frontend

backend:
	@echo "Starting backend server..."
	@cd $(BACKEND_PATH) && \
	uvicorn src.main:app --reload --port 8000

frontend:
	@echo "Starting frontend app..."
	@cd $(FRONTEND_PATH) && \
	npm run dev

build:
	@echo "Building project..."
	@echo "Cleaning up prior artifacts"
	@cd $(BACKEND_PATH) && rm -rf dist/*
	@cd $(FRONTEND_PATH) && rm -rf dist/* out/*
	@rm -rf dist/*
	@echo "Building backend..."
	@cd $(BACKEND_PATH) && \
	make onefolder
	@echo "Building frontend..."
	@cd $(FRONTEND_PATH) && npm run build
	@rm -rf dist && \
	cp -r $(FRONTEND_PATH)/dist dist
	@echo "Build complete."

frontend_controls_backend:
	@echo "Building backend"
	@cd $(BACKEND_PATH) && \
	make onefolder
	@echo "Running frontend"
	@cd $(FRONTEND_PATH) && \
	source go.sh --spawn-backend