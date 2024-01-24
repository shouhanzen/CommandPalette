#!/bin/bash
source ../backend/.venv/Scripts/activate
echo "Starting npm development server..."
npm run dev:next & npm run dev:electron -- "${@}" &
wait