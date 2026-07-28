# STRAY DOG Dynamic Menu

## What is already set
- DAILY SPECIALS is the landing / TODAY page.
- Every other Google Sheet tab becomes a menu tab automatically.
- The site includes a snapshot of the uploaded MASTER MENU so you can preview it immediately.
- `UPDATE` can be used by staff:
  - `HIDE`, `SOLD OUT`, `OFF`, `FALSE`, or `NO` = hidden from customer menu.
  - Any other text (for example `NEW`, `TODAY`, `LIMITED`) = shown as a badge.

## 1. Connect the live Google Sheet
Open the MASTER MENU spreadsheet.

Extensions > Apps Script

Paste the contents of `google-apps-script.gs` and save.

Deploy > New deployment > Web app

Choose:
- Execute as: Me
- Who has access: Anyone

Deploy and copy the URL ending in `/exec`.

Open `app.js` and paste that URL here:

    apiUrl: "PASTE_YOUR_APPS_SCRIPT_EXEC_URL_HERE",

Save.

## 2. Preview locally
Because browsers block some file-to-file requests when double-clicking HTML,
run a simple local server in this folder:

    python3 -m http.server 8080

Then open localhost port 8080 in your browser.

## 3. Publish
Upload these four web files to any static host:
- index.html
- style.css
- app.js
- menu-fallback.json

Good choices include Cloudflare Pages, Netlify, GitHub Pages, or Vercel.

## 4. QR
Point the permanent QR code to the final public menu URL.
Example: menu.yourdomain.com

Do not make a QR that points directly to Google Sheets. This lets you change
hosting/design later without changing the printed QR, as long as the public
menu URL stays the same.

## Staff workflow
DAILY SPECIALS = landing page.

To add today's highlight:
- Add/edit the item in DAILY SPECIALS.
- It appears automatically after the website refreshes.

To temporarily remove an item:
- Type SOLD OUT in its UPDATE cell.
- The public menu hides it.

To add a visible label:
- Type NEW, LIMITED, TODAY, etc. in UPDATE.

Prices and descriptions are read directly from the spreadsheet.


## V2 responsive update
This version is mobile-first and adapts automatically for phones, tablets/iPads, desktop, and phone landscape. Category tabs are horizontally swipeable on touch devices.
