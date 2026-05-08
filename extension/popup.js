const API_BASE = "http://localhost:3001";
let extractedData = null;
let sourceUrl = null;

// London area coordinate lookup
const LONDON_COORDS = {
  soho: { lat: 51.5134, lng: -0.1365 },
  shoreditch: { lat: 51.5265, lng: -0.0798 },
  camden: { lat: 51.5392, lng: -0.1426 },
  clapham: { lat: 51.4621, lng: -0.1681 },
  chelsea: { lat: 51.4876, lng: -0.1687 },
  islington: { lat: 51.536, lng: -0.1031 },
  hackney: { lat: 51.5432, lng: -0.0553 },
  brixton: { lat: 51.4613, lng: -0.1156 },
  default: { lat: 51.509, lng: -0.118 },
};

function guessCoords(city) {
  const lower = (city || "").toLowerCase();
  for (const [area, coords] of Object.entries(LONDON_COORDS)) {
    if (area !== "default" && lower.includes(area)) return coords;
  }
  return LONDON_COORDS.default;
}

function setStatus(msg, type) {
  const el = document.getElementById("status");
  el.textContent = msg;
  el.className = `status ${type}`;
}

function showExtracted(data) {
  document.getElementById("ex-title").textContent = data.title;
  document.getElementById("ex-industry").textContent = data.industry;
  document.getElementById("ex-price").textContent = data.asking_price ? `£${data.asking_price.toLocaleString()}` : "N/A";
  document.getElementById("ex-revenue").textContent = data.revenue ? `£${data.revenue.toLocaleString()}` : "N/A";
  document.getElementById("ex-profit").textContent = data.profit ? `£${data.profit.toLocaleString()}` : "N/A";
  document.getElementById("ex-city").textContent = data.city;
  document.getElementById("ex-employees").textContent = data.employees || "N/A";
  document.getElementById("extracted").classList.add("visible");
}

async function scrape() {
  const btn = document.getElementById("scrapeBtn");
  btn.disabled = true;
  btn.innerHTML = '<span class="spinner"></span>Extracting...';
  setStatus("Reading page content...", "info");

  try {
    // Get the active tab
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    sourceUrl = tab.url;

    // Inject script to grab page content
    const results = await chrome.scripting.executeScript({
      target: { tabId: tab.id },
      func: () => {
        // Get the main content text, stripping navigation etc
        const body = document.body.cloneNode(true);
        body.querySelectorAll("script, style, nav, footer, header, iframe, noscript").forEach(el => el.remove());
        return body.innerText;
      },
    });

    const pageText = results[0]?.result;
    if (!pageText || pageText.length < 50) {
      setStatus("Could not read page content. Try a listing page.", "error");
      btn.disabled = false;
      btn.textContent = "Import This Page";
      return;
    }

    setStatus("AI is extracting listing data...", "info");

    // Send to our API for extraction
    const res = await fetch(`${API_BASE}/api/admin/scrape`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text: pageText }),
    });

    const json = await res.json();

    if (!res.ok) {
      setStatus(json.error || "Extraction failed", "error");
      btn.disabled = false;
      btn.textContent = "Try Again";
      return;
    }

    extractedData = json.data;
    showExtracted(extractedData);
    setStatus("Data extracted! Review and save.", "success");
    btn.style.display = "none";
    document.getElementById("saveBtn").style.display = "block";

  } catch (err) {
    setStatus(`Error: ${err.message}`, "error");
    btn.disabled = false;
    btn.textContent = "Try Again";
  }
}

async function save() {
  if (!extractedData) return;

  const btn = document.getElementById("saveBtn");
  btn.disabled = true;
  btn.innerHTML = '<span class="spinner"></span>Saving...';

  const coords = guessCoords(extractedData.city);

  try {
    const res = await fetch(`${API_BASE}/api/listings`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...extractedData,
        latitude: coords.lat,
        longitude: coords.lng,
        location_precision: "approximate",
      }),
    });

    if (!res.ok) {
      const err = await res.json();
      setStatus(err.error || "Failed to save", "error");
      btn.disabled = false;
      btn.textContent = "Try Again";
      return;
    }

    setStatus("Listing saved to Next Owner!", "success");
    btn.style.display = "none";
    document.getElementById("openBtn").style.display = "block";

  } catch (err) {
    setStatus(`Error: ${err.message}`, "error");
    btn.disabled = false;
    btn.textContent = "Try Again";
  }
}

function openApp() {
  chrome.tabs.create({ url: `${API_BASE}/marketplace` });
}
