import { TrophyRoom } from "./TrophyRoom";
import { Achievement, AchievementStore } from "./achievments";
import { MetricsStore, NumberMetric } from "./metrics";

describe("TrophyRoom", () => {
	const metricStore = new MetricsStore(
		[
			new NumberMetric("test", 0),
			new NumberMetric("test2", 0),
			new NumberMetric("testLoad", 0),
		],
		{
			save: () => {},
			load: () => '{"testLoad":5}',
		}
	);
	const achievementStore = new AchievementStore(
		[
			new Achievement({
				id: "test",
				metrics: metricStore.require.test.greaterThan(10),
			}),
			new Achievement({
				id: "test2",
				metrics: metricStore.and(
					metricStore.require.test.greaterThan(10),
					metricStore.require.test2.greaterThan(10)
				),
			}),
		],
		{
			save: () => {},
			load: () => "{}",
		}
	);
	const trophyRoom = new TrophyRoom({
		metrics: metricStore,
		achievements: achievementStore,
	});

	it("should load the metrics and achievements when constructed", async () => {
		await trophyRoom.waitForLoad();
		expect(trophyRoom.metrics.getMetricValue("testLoad")).toBe(5);
	});

	it("should grant an achievement when the metrics are updated", async () => {
		await trophyRoom.waitForLoad();
		const listener = jest.fn();
		trophyRoom.achievements.on("achievementGranted", listener);
		metricStore.setMetric("test", 11);
		expect(listener).toHaveBeenCalledWith("test");
		metricStore.setMetric("test2", 11);
		expect(listener).toHaveBeenCalledWith("test2");
	});
});
