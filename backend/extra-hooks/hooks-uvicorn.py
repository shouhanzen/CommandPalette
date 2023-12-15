# Source: https://github.com/iancleary/pyinstaller-fastapi/blob/main/extra-hooks/hooks-uvicorn.py
# extra-hooks/hooks-uvicorn.py
from PyInstaller.utils.hooks import collect_submodules

hiddenimports = collect_submodules("uvicorn")
