const CONFIG = {
  // Your Google Spreadsheet ID:
  spreadsheetId: "1QAKL-DSoyqT6w9feI2L6TgiPXxQQtKW8Oz0Kpe9r96Q",
  // Apps Script endpoint goes here after deployment:
  apiUrl: "https://script.google.com/macros/s/AKfycbzf8EOsJvDSWTQxVdcaMAob9zAC02OPqUXOueUeFf0NXNNeQsRU9ENRkZ5zZ8lZdFAt/exec",
  landingSheet: "DAILY SPECIALS"
};

let DATA = {};
let current = CONFIG.landingSheet;
let activeGroup = "TODAY";
const GROUPS = {
  TODAY: ["DAILY SPECIALS"],
  FOOD: ["ALL DAY","PASTA & BIG PLATES","CUSTOM BREAKFAST","OTHERS","PASTRIES"],
  COFFEE: ["BESPOKE COFFEE","FILTERED COFFEE"],
  DRINKS: ["BEVERAGES","COCKTAILS"]
};

const fmtPrice = n => {
  if(n === "" || n === null || n === undefined) return "";
  const x = Number(n);
  if(Number.isNaN(x)) return String(n);
  return "Rp " + new Intl.NumberFormat("id-ID").format(x);
};

const CACHE_KEY = "straydog_menu_cache_v1";
const CACHE_TTL_MS = 60 * 1000; // treat cache as "fresh enough" for 60s

function readCache(){
  try{
    const raw = sessionStorage.getItem(CACHE_KEY);
    if(!raw) return null;
    return JSON.parse(raw);
  }catch(e){ return null; }
}
function writeCache(data){
  try{
    sessionStorage.setItem(CACHE_KEY, JSON.stringify({data, ts: Date.now()}));
  }catch(e){ /* storage unavailable or full - ignore, caching is a bonus not a requirement */ }
}

async function loadMenu(){
  const status = document.querySelector("#status");
  const cached = readCache();

  // Instantly paint whatever we have cached (any age) so the page never
  // sits on a blank "Loading…" screen while Apps Script wakes up.
  if(cached){
    DATA = cached.data;
    if(!DATA[current]) current = Object.keys(DATA)[0];
    buildTabs();
    render();
    const age = Date.now() - cached.ts;
    if(age < CACHE_TTL_MS){
      status.textContent = "Live from Stray Dog";
      return; // fresh enough, skip the network round-trip entirely
    }
    status.textContent = "Updating menu…";
  }else{
    status.textContent = "Loading live menu…";
  }

  try{
    if(!CONFIG.apiUrl) throw new Error("No API configured");
    const r = await fetch(CONFIG.apiUrl + "?v=" + Date.now(), {cache:"no-store"});
    if(!r.ok) throw new Error("API error");
    DATA = await r.json();
    writeCache(DATA);
    status.textContent = "Live from Stray Dog";
  }catch(e){
    if(cached){
      // Already showing cached data above; just note the sync failure.
      status.textContent = "Showing saved menu · live sync unavailable";
      return;
    }
    const r = await fetch("menu-fallback.json", {cache:"no-store"});
    DATA = await r.json();
    status.textContent = CONFIG.apiUrl ? "Showing saved menu · live sync unavailable" : "Preview mode · connect Google Sheet for live updates";
  }
  if(!DATA[current]) current = Object.keys(DATA)[0];
  buildTabs();
  render();
}

function buildTabs(){
  const tabs = document.querySelector("#tabs");
  tabs.innerHTML = "";
  const names = GROUPS[activeGroup].filter(n => DATA[n]);
  names.forEach(name=>{
    const b = document.createElement("button");
    b.className = "tab" + (name===current ? " active":"");
    b.textContent = name==="DAILY SPECIALS" ? "HIGHLIGHT" : name;
    b.onclick=()=>{current=name; buildTabs(); render();};
    tabs.appendChild(b);
  });
  tabs.style.display = names.length > 1 ? "flex" : "none";
}

document.querySelectorAll(".primary").forEach(btn=>{
  btn.onclick=()=>{
    activeGroup=btn.dataset.group;
    document.querySelectorAll(".primary").forEach(x=>x.classList.toggle("active",x===btn));
    current=GROUPS[activeGroup].find(n=>DATA[n]) || Object.keys(DATA)[0];
    buildTabs(); render();
    window.scrollTo({top:document.querySelector(".primary-tabs").offsetTop-70,behavior:"smooth"});
  };
});
function visibleItem(x){
  const u = (x.update||"").trim().toLowerCase();
  // Staff can type HIDE / SOLD OUT / OFF in UPDATE to remove it from customer view.
  return !["hide","sold out","soldout","off","false","no"].includes(u);
}
function renderIcons(notes){

    if(!notes) return "";

    return notes
        .split(",")
        .map(icon => icon.trim().toLowerCase())
        .map(icon => `
            <img
                class="food-icon"
                src="icons/${icon}.svg"
                alt="${icon}"
                title="${icon}">
        `)
        .join("");

}
function render(){
  const root = document.querySelector("#menu");
  const rows = (DATA[current]||[]).filter(visibleItem);
  root.innerHTML = `<div class="section-title">${current==="DAILY SPECIALS"?"TODAY / HIGHLIGHT":current}</div>`;
  if(!rows.length){root.innerHTML += `<div class="empty">Nothing on this section right now.</div>`;return;}
  let lastCat = null;
  rows.forEach(x=>{
    if(x.category && x.category!==lastCat){
      root.insertAdjacentHTML("beforeend", `<div class="category">${escapeHtml(x.category)}</div>`);
      lastCat=x.category;
    }
    const update=(x.update||"").trim();
    root.insertAdjacentHTML("beforeend", `<article class="item">
      <div class="item-head">
        <div class="item-name">${escapeHtml(x.item)}</div>
        <div class="price">${escapeHtml(fmtPrice(x.price))}</div>
      </div>
      ${x.description?`<div class="desc">${escapeHtml(x.description).replace(/\n/g,"<br>")}</div>`:""}
      ${x.notes?`<div class="note">${escapeHtml(x.notes)}</div>`:""}
      ${update && !["hide","sold out","soldout","off","false","no"].includes(update.toLowerCase())?`<div class="badge">${escapeHtml(update)}</div>`:""}
    </article>`);
  });
}

function escapeHtml(s){return String(s??"").replace(/[&<>"']/g,m=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"}[m]));}
document.querySelector("#refresh").onclick=loadMenu;
loadMenu();
