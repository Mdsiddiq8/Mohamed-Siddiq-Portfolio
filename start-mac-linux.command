#!/bin/bash
cd "$(dirname "$0")"
command -v node >/dev/null || { echo "Install Node.js 18+ from https://nodejs.org first, then run this again."; read -r; exit 1; }
[ -d node_modules ] || { echo "Installing packages, first run only..."; npm install; }
(sleep 6; (open http://localhost:3000 || xdg-open http://localhost:3000) >/dev/null 2>&1) &
npm run dev
