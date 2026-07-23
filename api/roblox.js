const JSON_HEADERS = {
  "Content-Type": "application/json; charset=utf-8",
  "Cache-Control": "s-maxage=3600, stale-while-revalidate=86400",
};

function send(res, statusCode, payload) {
  res.statusCode = statusCode;
  Object.entries(JSON_HEADERS).forEach(([key, value]) => res.setHeader(key, value));
  res.end(JSON.stringify(payload));
}

function robloxUrls(universeId) {
  return {
    details: `https://games.roblox.com/v1/games?universeIds=${universeId}`,
    icon: `https://thumbnails.roblox.com/v1/games/icons?universeIds=${universeId}&size=150x150&format=Png&isCircular=false`,
    thumbnail: `https://thumbnails.roblox.com/v1/games/multiget/thumbnails?universeIds=${universeId}&size=768x432&format=Png&isCircular=false`,
  };
}

async function getJson(url) {
  const response = await fetch(url, {
    headers: {
      Accept: "application/json",
      "User-Agent": "ZonkScriptsShowcase/1.0",
    },
  });

  if (!response.ok) {
    throw new Error(`Roblox API returned ${response.status} for ${url}`);
  }

  return response.json();
}

module.exports = async function handler(req, res) {
  const placeId = String(req.query?.placeId || "").trim();

  if (!/^\d+$/.test(placeId)) {
    send(res, 400, { error: "A numeric placeId query parameter is required." });
    return;
  }

  try {
    const universe = await getJson(`https://apis.roblox.com/universes/v1/places/${placeId}/universe`);
    const { details, icon, thumbnail } = robloxUrls(universe.universeId);
    const [gameDetails, gameIcons, gameThumbnails] = await Promise.all([
      getJson(details),
      getJson(icon),
      getJson(thumbnail),
    ]);

    send(res, 200, {
      title: gameDetails.data?.[0]?.name || `Roblox Game ${placeId}`,
      icon: gameIcons.data?.[0]?.imageUrl || "",
      thumbnail: gameThumbnails.data?.[0]?.thumbnails?.[0]?.imageUrl || "",
      universeId: universe.universeId,
    });
  } catch (error) {
    send(res, 502, { error: error.message, title: `Roblox Game ${placeId}` });
  }
};
