const scripts = [
  {
    gameId: "14713532223",
    addedAt: "2026-07-23",
    description: ["Auto Shoot", "Auto Melee", "Fists Infinite Damage", "No Fire Rate", "No Spread", "No Reload", "Multi Guns & Melee Equip", "Etc."],
    code: "loadstring(game:HttpGet('https://raw.githubusercontent.com/zscriptx/beatthetungs/refs/heads/main/nnnh'))()",
  },
  {
    gameId: "138837502355157",
    addedAt: "2026-07-22",
    description: ["Anti Entities", "Collect All Stickers in Lobby", "Etc."],
    code: "loadstring(game:HttpGet('https://raw.githubusercontent.com/sederyttv-scripter/grace/refs/heads/main/babyx'))()",
  },
  {
    gameId: "78353262320982",
    addedAt: "2026-07-21",
    description: ["Highlight Enphosos", "100% Accuracy"],
    code: 'loadstring(game:HttpGet("https://raw.githubusercontent.com/sederyttv-scripter/redesigned-octo-happiness/refs/heads/main/skibidienfosi"))()',
  },
];

const state = {
  items: scripts.map((script) => ({ ...script, title: "Loading Roblox experience...", icon: "", thumbnail: "", isLoading: true })),
  favorites: new Set(JSON.parse(localStorage.getItem("favoriteScripts") || "[]")),
  query: "",
  sort: "newest",
};

const cardsGrid = document.querySelector("#cardsGrid");
const emptyState = document.querySelector("#emptyState");
const searchInput = document.querySelector("#searchInput");
const sortSelect = document.querySelector("#sortSelect");
const toast = document.querySelector("#toast");

const roblox = {
  universe: (placeId) => `https://apis.roblox.com/universes/v1/places/${placeId}/universe`,
  details: (universeId) => `https://games.roblox.com/v1/games?universeIds=${universeId}`,
  icon: (universeId) => `https://thumbnails.roblox.com/v1/games/icons?universeIds=${universeId}&size=150x150&format=Png&isCircular=false`,
  thumbnail: (universeId) => `https://thumbnails.roblox.com/v1/games/multiget/thumbnails?universeIds=${universeId}&size=768x432&format=Png&isCircular=false`,
};

function escapeHtml(value) {
  return value.replace(/[&<>"]/g, (char) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[char]));
}

function highlightLua(code) {
  return escapeHtml(code)
    .replace(/(loadstring|game|HttpGet)/g, '<span class="lua-fn">$1</span>')
    .replace(/(&quot;.*?&quot;|'.*?')/g, '<span class="lua-str">$1</span>')
    .replace(/([()])/g, '<span class="lua-punc">$1</span>');
}

async function fetchGameInfo(script) {
  try {
    const universeResponse = await fetch(roblox.universe(script.gameId));
    if (!universeResponse.ok) throw new Error("Universe lookup failed");
    const { universeId } = await universeResponse.json();

    const [detailsResponse, iconResponse, thumbnailResponse] = await Promise.all([
      fetch(roblox.details(universeId)),
      fetch(roblox.icon(universeId)),
      fetch(roblox.thumbnail(universeId)),
    ]);

    const [details, icons, thumbnails] = await Promise.all([
      detailsResponse.json(),
      iconResponse.json(),
      thumbnailResponse.json(),
    ]);

    return {
      title: details.data?.[0]?.name || `Roblox Game ${script.gameId}`,
      icon: icons.data?.[0]?.imageUrl || "",
      thumbnail: thumbnails.data?.[0]?.thumbnails?.[0]?.imageUrl || "",
      universeId,
      isLoading: false,
    };
  } catch (error) {
    console.warn(`Could not fetch Roblox data for ${script.gameId}`, error);
    return { title: `Roblox Game ${script.gameId}`, icon: "", thumbnail: "", isLoading: false };
  }
}

function getFilteredItems() {
  const query = state.query.trim().toLowerCase();
  return [...state.items]
    .filter((item) => item.title.toLowerCase().includes(query) || item.gameId.includes(query))
    .sort((a, b) => {
      if (state.sort === "az") return a.title.localeCompare(b.title);
      if (state.sort === "za") return b.title.localeCompare(a.title);
      return new Date(b.addedAt) - new Date(a.addedAt);
    });
}

function render() {
  document.querySelector("#scriptCount").textContent = scripts.length;
  document.querySelector("#footerCount").textContent = scripts.length;
  document.querySelector("#lastUpdated").textContent = new Date(Math.max(...scripts.map((item) => new Date(item.addedAt)))).toLocaleDateString(undefined, { year: "numeric", month: "long", day: "numeric" });

  const items = getFilteredItems();
  emptyState.hidden = items.length > 0;
  cardsGrid.innerHTML = items.map((item, index) => cardTemplate(item, index)).join("");
}

function cardTemplate(item, index) {
  const fallbackImage = `https://placehold.co/768x432/111827/8b5cf6?text=${encodeURIComponent("Roblox Game")}`;
  const fallbackIcon = `https://placehold.co/150x150/111827/22d3ee?text=RBX`;
  const isFavorite = state.favorites.has(item.gameId);
  return `
    <article class="card" style="animation-delay:${index * 70}ms">
      <div class="cover-wrap">
        ${item.isLoading ? '<span class="skeleton" aria-label="Loading game image"></span>' : ""}
        <img class="cover" src="${item.thumbnail || fallbackImage}" alt="${escapeHtml(item.title)} thumbnail" loading="lazy" />
        <button class="favorite ${isFavorite ? "active" : ""}" data-favorite="${item.gameId}" aria-label="Favorite ${escapeHtml(item.title)}">♥</button>
      </div>
      <div class="card-body">
        <div class="game-row">
          <img class="icon" src="${item.icon || fallbackIcon}" alt="${escapeHtml(item.title)} icon" loading="lazy" />
          <div>
            <h2 class="game-title">${escapeHtml(item.title)}</h2>
            <p class="game-id">Game ID: ${item.gameId}</p>
          </div>
        </div>
        <ul class="description">${item.description.map((feature) => `<li>${escapeHtml(feature)}</li>`).join("")}</ul>
        <div class="tags">${item.description.map((feature) => `<span class="tag">${escapeHtml(feature)}</span>`).join("")}</div>
        <div class="code-block"><span class="code-label">LUA SCRIPT</span><pre><code>${highlightLua(item.code)}</code></pre></div>
        <div class="actions">
          <button class="button copy-btn" data-copy="${item.gameId}">Copy Script</button>
          <a class="button launch-btn" href="https://www.roblox.com/games/${item.gameId}" target="_blank" rel="noopener noreferrer">Launch Game</a>
        </div>
      </div>
    </article>`;
}

async function copyScript(gameId, button) {
  const script = scripts.find((item) => item.gameId === gameId);
  if (!script) return;
  await navigator.clipboard.writeText(script.code);
  button.classList.add("copied");
  button.textContent = "Copied!";
  toast.classList.add("show");
  setTimeout(() => {
    button.classList.remove("copied");
    button.textContent = "Copy Script";
    toast.classList.remove("show");
  }, 1700);
}

cardsGrid.addEventListener("click", (event) => {
  const copyButton = event.target.closest("[data-copy]");
  const favoriteButton = event.target.closest("[data-favorite]");
  if (copyButton) copyScript(copyButton.dataset.copy, copyButton);
  if (favoriteButton) {
    const id = favoriteButton.dataset.favorite;
    state.favorites.has(id) ? state.favorites.delete(id) : state.favorites.add(id);
    localStorage.setItem("favoriteScripts", JSON.stringify([...state.favorites]));
    render();
  }
});

searchInput.addEventListener("input", (event) => {
  state.query = event.target.value;
  render();
});

sortSelect.addEventListener("change", (event) => {
  state.sort = event.target.value;
  render();
});

render();
Promise.all(state.items.map(fetchGameInfo)).then((metadata) => {
  state.items = state.items.map((item, index) => ({ ...item, ...metadata[index] }));
  render();
});
