const ANWB_URL = "https://api.anwb.nl/routing/points-of-interest/v3/all";

function distanceKm(lat1, lon1, lat2, lon2) {
	const earth = 6371;
	const toRad = (degrees) => degrees * Math.PI / 180;
	const dLat = toRad(lat2 - lat1);
	const dLon = toRad(lon2 - lon1);
	const a = Math.sin(dLat / 2) ** 2
		+ Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
	return 2 * earth * Math.asin(Math.sqrt(a));
}

function boundingBox(lat, lon, radiusKm) {
	const latDelta = radiusKm / 111;
	const lonDelta = radiusKm / (111 * Math.cos(lat * Math.PI / 180));
	return {
		south: lat - latDelta,
		west: lon - lonDelta,
		north: lat + latDelta,
		east: lon + lonDelta,
	};
}

async function fetchStations(box) {
	const filter = [box.south, box.west, box.north, box.east].map((value) => value.toFixed(5)).join(",");
	const url = `${ANWB_URL}?type-filter=FUEL_STATION&bounding-box-filter=${filter}`;
	const response = await fetch(url, {
		headers: {
			Accept: "application/json",
			"User-Agent": "Mozilla/5.0 (compatible; Pumperly/1.0)",
		},
	});
	if (!response.ok) {
		throw new Error(`ANWB antwoordde met ${response.status}`);
	}
	const data = await response.json();
	return data.value || [];
}

function euro98Stations(stations, origin, radiusKm) {
	return stations.flatMap((station) => {
		const price = (station.prices || []).find((item) => item.fuelType === "EURO98" && item.value > 0);
		if (!price || !station.coordinates) return [];
		const km = distanceKm(origin.lat, origin.lon, station.coordinates.latitude, station.coordinates.longitude);
		if (km > radiusKm) return [];
		return [{
			name: (station.title || "Station").trim(),
			street: station.address?.streetAddress?.trim() || "",
			city: station.address?.city?.trim() || "",
			km,
			price: price.value,
		}];
	}).sort((a, b) => a.price - b.price || a.km - b.km);
}

async function loadEuro98(options = {}) {
	const lat = Number(options.lat);
	const lon = Number(options.lon);
	const radiusKm = options.radiusKm || 5;
	const count = options.count || 3;
	if (!Number.isFinite(lat) || !Number.isFinite(lon)) {
		throw new Error("Coördinaten ontbreken");
	}

	const stations = await fetchStations(boundingBox(lat, lon, radiusKm + 0.5));
	const matches = euro98Stations(stations, { lat, lon }, radiusKm).slice(0, count);
	if (!matches.length) {
		throw new Error(`Geen Euro 98 binnen ${radiusKm} km`);
	}

	return {
		updated: new Date().toISOString(),
		stations: matches,
	};
}

module.exports = { loadEuro98, distanceKm };
