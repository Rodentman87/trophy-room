import EventEmitter from "eventemitter3";
import { Achievement } from "./achievments/Achievement";
import { AchievementStore } from "./achievments/AchievementStore";
import { BaseMetric, MetricsStore } from "./metrics";
import { Serializable } from "./metrics/BaseMetric";

export interface TrophyRoomOptions<
	Metrics extends BaseMetric<string, unknown, Serializable>[],
	Achievements extends Achievement[]
> {
	metrics: MetricsStore<Metrics>;
	achievements: AchievementStore<Achievements>;
}

interface TrophyRoomEvents {
	loaded: () => void;
	loadingError: (error: unknown) => void;
}

export class TrophyRoom<
	Metrics extends BaseMetric<string, unknown, Serializable>[],
	Achievements extends Achievement[]
> extends EventEmitter<TrophyRoomEvents> {
	metrics: MetricsStore<Metrics>;
	achievements: AchievementStore<Achievements>;
	private loaded = false;

	constructor({
		metrics,
		achievements,
	}: TrophyRoomOptions<Metrics, Achievements>) {
		super();
		this.metrics = metrics;
		this.achievements = achievements;
		this.metrics.on("metricsUpdated", (metrics) => {
			this.achievements.evaluateAchievementsForMetrics(metrics, this.metrics);
		});
		// Call the load function for both stores
		Promise.all([
			this.metrics.loadMetrics(),
			this.achievements.loadAchievements(),
		])
			.then(() => {
				this.loaded = true;
				this.emit("loaded");
			})
			.catch((error) => {
				this.emit("loadingError", error);
			});
	}

	/**
	 * Waits for the trophy room to load. If it has already loaded, this function will return immediately.
	 * @returns A promise that resolves when the trophy room has loaded.
	 */
	async waitForLoad() {
		if (this.loaded) return Promise.resolve();
		return new Promise<void>((resolve, reject) => {
			this.once("loaded", resolve);
			this.once("loadingError", reject);
		});
	}
}
