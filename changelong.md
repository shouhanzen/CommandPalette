v0.2.1:

- Fixed commands
- Added support for custom commands under ~/.palette/scripts/commands.json
- No longer opening server on port 8000 (now starts on port 21410)
- Icon caching makes command loading ~2x faster on reloads
- Showing only the first 50 commands of the command list improves performance of frontend