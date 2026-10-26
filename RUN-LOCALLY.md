# Run on localhost (VS Code)

1. Install Node.js 18 or newer from https://nodejs.org (check: `node -v`).
2. VS Code > File > Open Folder > select `siddiq-portfolio`.
3. Terminal > New Terminal, then run:
   ```
   npm install
   npm run dev
   ```
4. Open http://localhost:3000 in Chrome.

Shortcut: double-click `start-windows.bat` (Windows) or `start-mac-linux.command` (Mac).

## Make the intro voice play automatically on YOUR machine
Browsers block sound until you allow it for the site. Do this once in Chrome:
Settings > Privacy and security > Site settings > Sound > "Allow" > add `http://localhost:3000`
(or open `chrome://settings/content/sound`). After that the intro speaks by itself on every load
and every time you scroll back to it. Visitors on the internet still need one tap, which is a browser rule.

## Optional
- `NEXT_PUBLIC_ENTER_GATE=true` in `.env.local` shows an "Enter with sound" welcome screen (off by default).

## If it does not start
- `node -v` must print v18 or higher.
- Port busy: run `npx next dev -p 3001` and open http://localhost:3001.
- Delete the `node_modules` and `.next` folders, then run `npm install` again.
