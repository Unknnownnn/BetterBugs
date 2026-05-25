BetterBugs v1.0.0 — AI-Native Bug Capture Platform
====================================================

Thank you for installing BetterBugs!

QUICK START
-----------
1. Run "BetterBugs Launcher" from the Start Menu or Desktop
2. Services will start automatically:
   - API:       http://localhost:3001
   - Dashboard: http://localhost:3002
   - MCP:       stdio transport (for Cursor/Claude)

CHROME EXTENSION
----------------
1. Open Chrome and go to: chrome://extensions
2. Enable "Developer mode" (top right toggle)
3. Click "Load unpacked"
4. Select the "extension" folder inside your install directory
   Default: C:\Program Files\BetterBugs\extension
5. Open the extension options and set:
   - API Base URL: http://localhost:3001/api/v1
   - Project Key:  (the key you entered during installation)

MCP SERVER (Cursor / Claude Desktop)
-------------------------------------
Add to your Cursor/Claude MCP config:

  {
    "mcpServers": {
      "betterbugs": {
        "command": "C:\\Program Files\\BetterBugs\\mcp-server\\betterbugs-mcp.exe"
      }
    }
  }

MONGODB REQUIREMENT
-------------------
BetterBugs requires a MongoDB instance. Options:
  - Free cloud: https://www.mongodb.com/atlas (free tier)
  - Local:      mongodb://localhost:27017

If you need to change your MongoDB URI after installation,
edit the .env file in your install directory.

LOGS
----
Service logs are stored in: <install dir>\logs\
  - api.log
  - dashboard.log
  - mcp.log

UNINSTALL
---------
Use "Add or Remove Programs" in Windows Settings,
or run the uninstaller from the Start Menu.

SUPPORT
-------
GitHub: https://github.com/Unknnownnn/BetterBugs
