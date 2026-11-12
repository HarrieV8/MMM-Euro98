const NodeHelper = require("node_helper");
const Log = require("logger");
const { loadEuro98 } = require("./anwb");

module.exports = NodeHelper.create({
	start() {
		this.config = null;
		this.timer = null;
	},

	socketNotificationReceived(notification, payload) {
		if (notification !== "EURO98_CONFIG") return;
		this.config = payload;
		clearInterval(this.timer);
		const interval = this.config.updateInterval || 6 * 60 * 60 * 1000;
		this.timer = setInterval(() => this.refresh(), interval);
		this.refresh();
	},

	async refresh() {
		try {
			const data = await loadEuro98(this.config);
			this.sendSocketNotification("EURO98_DATA", data);
		} catch (error) {
			Log.error(`[MMM-Euro98] ${error.message}`);
			this.sendSocketNotification("EURO98_ERROR", { message: error.message });
		}
	},
});
