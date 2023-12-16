#!/bin/bash
cd backend
source .venv/Scripts/activate
make onefolder

cd ..
cd frontend
npm run build

cd ..
rm -rf dist
mkdir dist
cp -r backend/dist/backend* dist/backend
cp -r frontend/dist/Palette*.exe dist/Palette.exe
