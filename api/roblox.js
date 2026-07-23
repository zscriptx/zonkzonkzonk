const JSON_HEADERS = {
  "Content-Type": "application/json; charset=utf-8",
  "Cache-Control": "s-maxage=3600, stale-while-revalidate=86400",
};

function send(res, statusCode, payload) {
  res.statusCode = statusCode;
  Object.entries(JSON_HEADERS).forEach(([key, value]) => res.setHeader(key, value));
  res.end(JSON.stringify(payload));
}

const endpoints = {
  placeDetails: (placeId) => `https://games.roblox.com/v1/games/multiget-place-details?placeIds=${placeId}`,
  universeFromPlace: (placeId) => `https://apis.roblox.com/universes/v1/places/${placeId}/universe`,
  details: (universeId) => `https://games.roblox.com/v1/games?universeIds=${universeId}`,
  iconByUniverse: (universeId) => `https://thumbnails.roblox.com/v1/games/icons?universeIds=${universeId}&size=150x150&format=Png&isCircular=false`,
  iconByPlace: (placeId) => `https://thumbnails.roblox.com/v1/places/gameicons?placeIds=${placeId}&size=150x150&format=Png&isCircular=false`,
  thumbnail: (universeId) => `https://thumbnails.roblox.com/v1/games/multiget/thumbnails?universeIds=${universeId}&size=768x432&format=Png&isCircular=false`,
};

async function getJson(url) {
  const response = await fetch(url, {
    headers: {
      Accept: "application/json",
      "User-Agent": "Mozilla/5.0 ZonkScriptsShowcase/1.0",
    },
  });

  if (!response.ok) {
    throw new Error(`Roblox API returned ${response.status} for ${url}`);
  }

  return response.json();
}

async function settleJson(url) {
  try {
    return { data: await getJson(url), error: null };
  } catch (error) {
    return { data: null, error: error.message };
  }
}

function firstImageUrl(payload) {
  return payload?.data?.[0]?.imageUrl || payload?.data?.[0]?.thumbnails?.[0]?.imageUrl || "";
}

module.exports = async function handler(req, res) {
  const placeId = String(req.query?.placeId || "").trim();

  if (!/^\d+$/.test(placeId)) {
    send(res, 400, { error: "A numeric placeId query parameter is required." });
    return;
  }

  const errors = [];
  const placeDetailsResult = await settleJson(endpoints.placeDetails(placeId));
  if (placeDetailsResult.error) errors.push(placeDetailsResult.error);

  const placeDetails = placeDetailsResult.data?.[0];
  let universeId = placeDetails?.universeId;
  let title = placeDetails?.name || "";

  if (!universeId) {
    const universeResult = await settleJson(endpoints.universeFromPlace(placeId));
    if (universeResult.error) errors.push(universeResult.error);
    universeId = universeResult.data?.universeId;
  }

  const requests = [settleJson(endpoints.iconByPlace(placeId))];
  if (universeId) {
    requests.push(
      settleJson(endpoints.details(universeId)),
      settleJson(endpoints.iconByUniverse(universeId)),
      settleJson(endpoints.thumbnail(universeId)),
    );
  }

  const [placeIcon, gameDetails, universeIcon, gameThumbnail] = await Promise.all(requests);
  [placeIcon, gameDetails, universeIcon, gameThumbnail].forEach((result) => {
    if (result?.error) errors.push(result.error);
  });

  title = gameDetails?.data?.data?.[0]?.name || title || `Roblox Game ${placeId}`;

  send(res, 200, {
    title,
    icon: firstImageUrl(universeIcon?.data) || firstImageUrl(placeIcon?.data),
    thumbnail: firstImageUrl(gameThumbnail?.data) || firstImageUrl(placeIcon?.data),
    universeId: universeId || null,
    warnings: errors,
  });
};
