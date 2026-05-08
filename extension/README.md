# Next Owner Chrome Extension

Import business listings from any website into Next Owner with one click.

## Install

1. Open Chrome → `chrome://extensions/`
2. Enable **Developer mode** (top right toggle)
3. Click **Load unpacked**
4. Select the `extension/` folder from this project

## Use

1. Make sure the Next Owner dev server is running on `http://localhost:3001`
2. Make sure you're logged in at `http://localhost:3001/login`
3. Navigate to any business-for-sale listing page (RightBiz, BusinessesForSale, Daltons, etc.)
4. Click the extension icon
5. Click **Import This Page** — AI extracts the data
6. Review the extracted data
7. Click **Save to Next Owner** — creates the listing

## How it works

- Uses `chrome.scripting.executeScript` to read the page text from your browser (bypasses Cloudflare)
- Sends the text to `/api/admin/scrape` which uses GPT-4o-mini to extract structured business data
- Saves to Supabase via `/api/listings`
