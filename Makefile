.PHONY: start_dev backend frontend build create_venv

VENV_PATH = backend/.venv
ACTIVATE_VENV = source $(VENV_PATH)/Scripts/activate
BACKEND_PATH = backend
FRONTEND_PATH = frontend

backend: create_venv
	@echo "Starting backend server..."
	@cd $(BACKEND_PATH) && \
	$(ACTIVATE_VENV) && \
	uvicorn src.main:app --reload --port 8000

frontend: create_venv
	@echo "Activating virtual environment..."
	@$(ACTIVATE_VENV)
	@echo "Starting npm development server..."
	@cd $(FRONTEND_PATH) && npm run dev

build: create_venv
	@echo "Building project..."
	@echo "Cleaning up prior artifacts"
	@cd $(BACKEND_PATH) && rm -rf dist/*
	@cd $(FRONTEND_PATH) && rm -rf dist/* out/*
	@rm -rf dist/*
	@echo "Building backend..."
	@cd $(BACKEND_PATH) && \
	source .venv/Scripts/activate && \
	make onefolder
	@echo "Building frontend..."
	@cd $(FRONTEND_PATH) && npm run build
	@rm -rf dist && mkdir dist && \
	cp -r $(FRONTEND_PATH)/dist/Palette*.exe dist/Palette_Setup.exe
	@echo "Build complete."

create_venv:
	@if [ ! -d "$(VENV_PATH)" ]; then \
		echo "Creating virtual environment..."; \
		python -m venv $(VENV_PATH); \
		echo "Installing dependencies..."; \
		$(ACTIVATE_VENV) && \
		pip install -r $(BACKEND_PATH)/requirements.txt; \
	else \
		echo "Virtual environment already exists."; \
	fi