# Palette

A command palette for your desktop.
<img width="960" alt="image" src="https://github.com/D0rkKnight/CommandPalette/assets/20606858/a579acc8-c74f-4bc4-b2ef-e1199868f20c">

## Controls
`Ctrl+Shift+Alt+P` opens and closes the Palette
`Enter` executes the highlighted command
`Tab` tabs through the available commads

## Architecture

Palette contains an Electron client that serves the GUI, alongside a Python FastAPI server that provides and executes commands.
