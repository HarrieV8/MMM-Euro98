Module.register("MMM-Euro98", {
	defaults: {
		lat: 52.0822933,
		lon: 4.3714055,
		radiusKm: 5,
		count: 3,
		updateInterval: 6 * 60 * 60 * 1000,
	},

	start() {
		this.dataSet = null;
		this.error = null;
		this.sendSocketNotification("EURO98_CONFIG", this.config);
	},

	getStyles() {
		return ["MMM-Euro98.css"];
	},

	socketNotificationReceived(notification, payload) {
		if (notification === "EURO98_DATA") {
			this.dataSet = payload;
			this.error = null;
			this.updateDom(500);
		}
		if (notification === "EURO98_ERROR" && !this.dataSet) {
			this.error = payload.message;
			this.updateDom(500);
		}
	},

	getDom() {
		const wrapper = document.createElement("div");
		wrapper.className = "euro98";

		if (this.error && !this.dataSet) {
			wrapper.innerHTML = `<div class="dimmed small">${this.error}</div>`;
			return wrapper;
		}
		if (!this.dataSet) {
			wrapper.innerHTML = `<div class="dimmed small">Euro 98 laden…</div>`;
			return wrapper;
		}

		for (const station of this.dataSet.stations) {
			wrapper.append(this.stationRow(station));
		}
		return wrapper;
	},

	stationRow(station) {
		const row = document.createElement("div");
		row.className = "euro98-row";
		const price = new Intl.NumberFormat("nl-NL", {
			minimumFractionDigits: 3,
			maximumFractionDigits: 3,
		}).format(station.price);
		const distance = new Intl.NumberFormat("nl-NL", {
			minimumFractionDigits: 1,
			maximumFractionDigits: 1,
		}).format(station.km);
		const place = [station.street, station.city].filter(Boolean).join(", ");
		row.innerHTML = `<div class="euro98-station"><div>${station.name}</div><div class="xsmall dimmed">${place} · ${distance} km</div></div><div class="euro98-price bright">${price}</div>`;
		return row;
	},
});
