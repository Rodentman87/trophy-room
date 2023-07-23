import { ContextStore, NumberContextValue } from "../context";
import { MetricsStore, NumberMetric } from "../metrics";
import { Achievement } from "./Achievement";
import { AchievementStore } from "./AchievementStore";

describe("AchievementStore", () => {
	const metricStore = new MetricsStore(
		[
			new NumberMetric("test", 0),
			new NumberMetric("test2", 0),
			new NumberMetric("test3", 0),
		],
		{
			save: () => {},
			load: () => "{}",
		}
	);
	const contextStore = new ContextStore([new NumberContextValue("test", 0)]);
	class TestAchievementClass<
		const ID extends string,
		ContextKeys extends string
	> extends Achievement<ID, ContextKeys, typeof contextStore> {}
	const mainSave = jest.fn();
	const store = new AchievementStore(
		[
			new TestAchievementClass({
				id: "test",
				metrics: metricStore.require.test.greaterThan(10),
			}),
			new TestAchievementClass({
				id: "test2",
				metrics: metricStore.and(
					metricStore.require.test.greaterThan(10),
					metricStore.require.test2.greaterThan(10)
				),
			}),
			new TestAchievementClass({
				id: "test3",
				metrics: metricStore.or(
					metricStore.require.test.greaterThan(100),
					metricStore.require.test3.greaterThan(0)
				),
			}),
			new TestAchievementClass({
				id: "test4",
				metrics: metricStore.not(metricStore.require.test.greaterThan(10)),
			}),
			new TestAchievementClass({
				id: "test5",
				metrics: metricStore.never(),
			}),
			new TestAchievementClass({
				id: "contextTest",
				metrics: metricStore.never(),
				contextKeys: ["test"],
			}),
		],
		{
			save: mainSave,
			load: () => "",
			metricsStore: metricStore,
			contextStore: contextStore,
		}
	);

	it("should return the proper relevant metrics for a requirement", () => {
		// Single req
		expect(
			store.getMetricsFromRequirement(metricStore.require.test.greaterThan(10))
		).toEqual(["test"]);
		// And-ed reqs
		expect(
			store.getMetricsFromRequirement(
				metricStore.and(
					metricStore.require.test.greaterThan(10),
					metricStore.require.test2.greaterThan(10)
				)
			)
		).toEqual(["test", "test2"]);
		// Or-ed reqs
		expect(
			store.getMetricsFromRequirement(
				metricStore.or(
					metricStore.require.test.greaterThan(10),
					metricStore.require.test2.greaterThan(10)
				)
			)
		).toEqual(["test", "test2"]);
		// Not-ed req
		expect(
			store.getMetricsFromRequirement(
				metricStore.not(metricStore.require.test.greaterThan(10))
			)
		).toEqual(["test"]);
		// Never req
		expect(store.getMetricsFromRequirement(metricStore.never())).toEqual([]);
	});

	it("should track the achievements related to each metric", () => {
		expect(store.metricToAchievementMap.get("test")).toEqual([
			"test",
			"test2",
			"test3",
			"test4",
		]);
	});

	it("should grant achievements if all requirements are met", () => {
		const listener = jest.fn();
		store.on("achievementGranted", listener);
		metricStore.setMetric("test", 11);
		store.evaluateAchievement("test");
		// Event should be emitted
		expect(listener).toHaveBeenCalledWith("test");
		// Metadata should be updated
		expect(store.achievementsMetadata.get("test")?.grantedAt).not.toBeNull();
		// The achievement should be removed from the metricToAchievementMap
		expect(store.metricToAchievementMap.get("test")).not.toContain("test");
		// It should save the achievements
		expect(mainSave).toHaveBeenCalledTimes(1);
		metricStore.setMetric("test2", 11);
		store.evaluateAchievement("test2");
		expect(listener).toHaveBeenCalledWith("test2");
		expect(store.achievementsMetadata.get("test2")?.grantedAt).not.toBeNull();
		expect(store.metricToAchievementMap.get("test")).not.toContain("test2");
		expect(store.metricToAchievementMap.get("test2")).not.toContain("test2");
		expect(mainSave).toHaveBeenCalledTimes(2);
		metricStore.setMetric("test3", 1);
		store.evaluateAchievement("test3");
		expect(listener).toHaveBeenCalledWith("test3");
		expect(store.achievementsMetadata.get("test3")?.grantedAt).not.toBeNull();
		expect(store.metricToAchievementMap.get("test")).not.toContain("test3");
		expect(store.metricToAchievementMap.get("test3")).not.toContain("test3");
		expect(mainSave).toHaveBeenCalledTimes(3);
		metricStore.setMetric("test", 9);
		store.evaluateAchievement("test4");
		expect(listener).toHaveBeenCalledWith("test4");
		expect(store.achievementsMetadata.get("test4")?.grantedAt).not.toBeNull();
		expect(store.metricToAchievementMap.get("test")).not.toContain("test4");
		expect(mainSave).toHaveBeenCalledTimes(4);
		store.evaluateAchievement("test5");
		expect(listener).not.toHaveBeenCalledWith("test5");
		expect(store.achievementsMetadata.get("test5")?.grantedAt).toBeNull();
		expect(mainSave).not.toHaveBeenCalledTimes(5);
	});

	it("should not grant an achievement if it has already been granted", () => {
		store.grantAchievement("test");
		const listener = jest.fn();
		store.on("achievementGranted", listener);
		store.grantAchievement("test");
		store.evaluateAchievement("test");
		expect(listener).not.toHaveBeenCalledWith("test");
		expect(store.achievementsMetadata.get("test")?.grantedAt).not.toBeNull();
		expect(store.metricToAchievementMap.get("test")).not.toContain("test");
		expect(mainSave).not.toHaveBeenCalledTimes(5);
		store.revokeAchievement("test");
		const revokeListener = jest.fn();
		store.on("achievementRevoked", revokeListener);
		store.revokeAchievement("test");
		expect(revokeListener).not.toHaveBeenCalledWith("test");
	});

	it("should error on an achievement that doesn't exist", () => {
		// @ts-expect-error - should error
		expect(() => store.grantAchievement("test6")).toThrow();
		// @ts-expect-error - should error
		expect(() => store.evaluateAchievement("test6")).toThrow();
		// @ts-expect-error - should error
		expect(() => store.getAchievementMetadata("test6")).toThrow();
		// @ts-expect-error - should error
		expect(() => store.revokeAchievement("test6")).toThrow();
	});

	it("should check all achievements for a relevant metric", () => {
		const save = jest.fn();
		const newStore = new AchievementStore(
			[
				new Achievement({
					id: "test",
					metrics: metricStore.require.test.greaterThan(10),
				}),
				new Achievement({
					id: "test2",
					metrics: metricStore.or(
						metricStore.require.test.greaterThan(10),
						metricStore.require.test3.greaterThan(0)
					),
				}),
				new Achievement({
					id: "test3",
					metrics: metricStore.never(),
				}),
			],
			{
				save: save,
				load: () => "",
				metricsStore: metricStore,
			}
		);
		const listener = jest.fn();
		newStore.on("achievementGranted", listener);
		metricStore.setMetric("test", 11);
		newStore.evaluateAchievementsForMetrics(["test"]);
		expect(listener).toHaveBeenCalledWith("test");
		expect(listener).toHaveBeenCalledWith("test2");
		expect(listener).not.toHaveBeenCalledWith("test3");
		expect(save).toHaveBeenCalledTimes(1);
	});

	it("should store metadata for granted achievments, including context values", () => {
		expect(store.getAchievementMetadata("contextTest")).toEqual({
			granted: false,
			grantedAt: null,
		});
		contextStore.setContextValue("test", 5);
		store.grantAchievement("contextTest");
		expect(store.getAchievementMetadata("contextTest")).toEqual({
			granted: true,
			grantedAt: expect.any(Date),
			test: 5,
		});
	});
});
