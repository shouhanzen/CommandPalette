.PHONY: start_dev

start_dev:
	@echo "Activating virtual environment..."
	@source ../backend/.venv/Scripts/activate
	@echo "Starting npm development server..."
	@npm run dev

build_project:
	@echo "Building project..."
	@cd backend && \
	source .venv/Scripts/activate && \
	make onefolder && \
	cp -r dist/backend* ../frontend/dist/backend
	@cd frontend && \
	npm run build
	@rm -rf dist && \
	mkdir dist && \
	cp -r frontend/dist/Palette*.exe dist/Palette.exe
	@echo "Build complete."