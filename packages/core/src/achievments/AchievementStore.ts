import EventEmitter from "eventemitter3";
import { Serializable } from "../CommonTypes";
import { BaseContextValue } from "../context/BaseContextValue";
import { ContextStore } from "../context/ContextStore";
import { BaseMetric } from "../metrics";
import {
	AchievementMetricRequirement,
	MetricsStore,
} from "../metrics/MetricsStore";
import { Achievement } from "./Achievement";

interface AchievementStoreEvents {
	achievementGranted: (achievementId: string) => void;
	achievementRevoked: (achievementId: string) => void;
}

type BaseAchievementMetadata =
	| {
			granted: true;
			grantedAt: Date;
	  }
	| {
			granted: false;
			grantedAt: null;
	  };

interface SerializedAchievementMetadata {
	grantedAt: string | null;
}

interface AchievementStoreOptions {
	save: (serialized: string) => void | Promise<void>;
	load: () => string | Promise<string>;
	metricsStore: MetricsStore<BaseMetric<string, unknown, Serializable>[]>;
	contextStore?: ContextStore;
}

export type ContextShape<
	Context extends ContextStore,
	ContextKeys extends string
> =
	| {
			granted: false;
			grantedAt: null;
	  }
	| ({
			[Key in ContextKeys]: Context extends ContextStore<infer ContextValues>
				? Extract<ContextValues[number], { id: Key }> extends BaseContextValue<
						string,
						infer ValueType,
						Serializable
				  >
					? ValueType
					: never
				: never;
	  } & {
			granted: true;
			grantedAt: Date;
	  });

export class AchievementStore<
	const Achievements extends
		| Achievement<string, string>[]
		| readonly Achievement<string, string>[]
> extends EventEmitter<AchievementStoreEvents> {
	achievements = new Map<
		Achievements[number]["id"],
		Achievement<string, string>
	>();
	achievementsMetadata = new Map<
		string,
		Omit<BaseAchievementMetadata, "granted">
	>();
	metricToAchievementMap = new Map<string, Achievements[number]["id"][]>();
	private evaluatingMultipleAchievements = false;

	saveFunction: AchievementStoreOptions["save"];
	loadFunction: AchievementStoreOptions["load"];
	metricsStore: AchievementStoreOptions["metricsStore"];
	contextStore?: AchievementStoreOptions["contextStore"];

	constructor(achievements: Achievements, options: AchievementStoreOptions) {
		super();
		this.saveFunction = options.save;
		this.loadFunction = options.load;
		this.metricsStore = options.metricsStore;
		this.contextStore = options.contextStore;
		achievements.forEach((achievement) => {
			this.achievements.set(achievement.id, achievement);
			this.achievementsMetadata.set(achievement.id, {
				grantedAt: null,
			});
			const relatedMetrics = this.getMetricsFromRequirement(
				achievement.metrics
			);
			relatedMetrics.forEach((metric) => {
				const current = this.metricToAchievementMap.get(metric) ?? [];
				this.metricToAchievementMap.set(metric, [...current, achievement.id]);
			});
		});
	}

	/**
	 * Call this function to load the achievement metadata from the load function provided in the constructor.
	 * This is called when your TrophyRoom is created, but you can call it manually if you need to.
	 */
	async loadAchievements() {
		const serialized = await this.loadFunction();
		const parsed = JSON.parse(serialized);
		Object.entries(parsed).forEach((entry) => {
			const [id, value] = entry as [string, SerializedAchievementMetadata];
			const metadata = this.achievementsMetadata.get(id);
			if (!metadata) return; // Ignore invalid achievements, since they may have been removed
			this.achievementsMetadata.set(id, {
				...metadata,
				grantedAt:
					value.grantedAt !== null
						? new Date(value.grantedAt)
						: value.grantedAt,
			});
		});
	}

	/**
	 * Call this function to save the achievement metadata to the save function provided in the constructor.
	 * This is called automatically when an achievement is granted, but you can call it manually if you need to.
	 */
	async saveAchievements() {
		const serialized = JSON.stringify(
			Object.fromEntries(
				Array.from(this.achievementsMetadata.entries()).map(([id, value]) => [
					id,
					{
						grantedAt: value.grantedAt?.toISOString() ?? null,
					},
				])
			)
		);
		await this.saveFunction(serialized);
	}

	/**
	 * Takes in an achievement requirement and returns a list of metrics that are referenced in the requirement.
	 * This is used to keep track of which achievements need to be re-evaluated when a metric is updated.
	 * @param req The requirement to get the metrics from
	 * @returns A list of metrics that are referenced in the requirement
	 */
	getMetricsFromRequirement(req: AchievementMetricRequirement): string[] {
		switch (req.type) {
			case "comparison":
				return [req.metric];
			case "and":
			case "or":
				// Convert to set to remove duplicates
				return Array.from(
					new Set(
						req.metrics.flatMap((metric) =>
							this.getMetricsFromRequirement(metric)
						)
					)
				);
			case "not":
				return this.getMetricsFromRequirement(req.metric);
			case "never":
				return [];
		}
	}

	/**
	 * Returns the achievement with the given ID
	 * @param achievementId The achievement to get
	 * @returns The achievement's information
	 */
	getAchievement<ID extends Achievements[number]["id"]>(
		achievementId: ID
	): Extract<Achievements[number], { id: ID }> {
		const achievement = this.achievements.get(achievementId);
		if (!achievement) {
			throw new Error(`Achievement ${achievementId} does not exist`);
		}
		return achievement as Extract<Achievements[number], { id: ID }>;
	}

	/**
	 * Returns the metadata for an achievement. This includes the granted status, and any context values that were stored when the achievement was granted
	 * @param achievementId The achievement to get the metadata for
	 * @returns The metadata for the achievement
	 */
	getAchievementMetadata<ID extends Achievements[number]["id"]>(
		achievementId: ID
	): Extract<Achievements[number], { id: ID }> extends Achievement<
		string,
		infer ContextKeys,
		infer Context
	>
		? ContextShape<Context, ContextKeys>
		: never {
		const metadata = this.achievementsMetadata.get(achievementId);
		if (!metadata) {
			throw new Error(`Achievement ${achievementId} does not exist`);
		}
		return {
			...metadata,
			granted: metadata.grantedAt !== null,
			// eslint-disable-next-line @typescript-eslint/no-explicit-any
		} as any;
	}

	/**
	 * Grants an achievement. This can be called manually, but is usually called automatically when an achievement is earned.
	 * This function will emit the `achievementGranted` event if the achievement was not already granted, and will update the metadata for
	 * the achievement to mark it as granted.
	 * @param achievementId The achievement to grant
	 */
	grantAchievement(achievementId: Achievements[number]["id"]) {
		const achievement = this.achievements.get(achievementId);
		if (!achievement) {
			throw new Error(`Achievement ${achievementId} does not exist`);
		}
		const current = this.achievementsMetadata.get(achievementId)!;
		if (current?.grantedAt !== null) {
			// Already granted, do nothing
			return;
		}
		// Update the metadata
		this.achievementsMetadata.set(achievementId, {
			...current!,
			grantedAt: new Date(),
			...this.contextStore?.getContextValues(achievement.contextKeys),
		});
		// Save the metadata (if we're not potentially updating multiple achievements)
		if (!this.evaluatingMultipleAchievements) {
			this.saveAchievements();
		}
		// Emit the event
		this.emit("achievementGranted", achievementId);
		// Remove the achievement from the metric map to save a bit of memory and processing
		const relatedMetrics = this.getMetricsFromRequirement(achievement.metrics);
		relatedMetrics.forEach((metric) => {
			const current = this.metricToAchievementMap.get(metric) ?? [];
			this.metricToAchievementMap.set(
				metric,
				current.filter((id) => id !== achievementId)
			);
		});
	}

	revokeAchievement(achievementId: Achievements[number]["id"]) {
		const achievement = this.achievements.get(achievementId);
		if (!achievement) {
			throw new Error(`Achievement ${achievementId} does not exist`);
		}
		const current = this.achievementsMetadata.get(achievementId)!;
		if (current?.grantedAt === null) {
			// Already revoked, do nothing
			return;
		}
		// Update the metadata
		this.achievementsMetadata.set(achievementId, {
			...current!,
			grantedAt: null,
		});
		// Save the metadata (if we're not potentially updating multiple achievements)
		if (!this.evaluatingMultipleAchievements) {
			this.saveAchievements();
		}
		// Emit the event
		this.emit("achievementRevoked", achievementId);
		// Add the achievement back to the metric map
		const relatedMetrics = this.getMetricsFromRequirement(achievement.metrics);
		relatedMetrics.forEach((metric) => {
			const current = this.metricToAchievementMap.get(metric) ?? [];
			this.metricToAchievementMap.set(metric, [...current, achievementId]);
		});
	}

	/**
	 * Takes a list of updated metrics and evaluates all achievements that are related to those metrics for completion.
	 * You can call this manually, but it is usually called automatically when a metric is updated.
	 * @param metrics The metrics that were updated
	 * @param metricsStore The metrics store to evaluate the achievements with
	 */
	evaluateAchievementsForMetrics(metrics: string[]) {
		this.evaluatingMultipleAchievements = true;
		const relevantAchievements = Array.from(
			new Set(
				metrics.flatMap(
					(metric) => this.metricToAchievementMap.get(metric) ?? []
				)
			)
		);
		relevantAchievements.forEach((achievementId) =>
			this.evaluateAchievement(achievementId)
		);
		this.evaluatingMultipleAchievements = false;
		// Save once manually at the end
		this.saveAchievements();
	}

	/**
	 * Evaluates a single achievement for completion based on the metrics in the metrics store. You can call this manually, but it is usually
	 * called automatically when a metric is updated.
	 * @param achievementId The achievement to evaluate
	 * @param metricsStore The metrics store to evaluate the achievement with
	 */
	evaluateAchievement(achievementId: Achievements[number]["id"]) {
		const achievement = this.achievements.get(achievementId);
		if (!achievement) {
			throw new Error(`Achievement ${achievementId} does not exist`);
		}
		const current = this.achievementsMetadata.get(achievementId)!;
		if (current?.grantedAt !== null) {
			// Already granted
			return;
		}
		const requirementsMet = this.checkRequirement(achievement.metrics);
		if (requirementsMet) {
			this.grantAchievement(achievementId);
		}
	}

	/**
	 * Takes in an achievement requirement and checks if the requirement is met based on the metrics in the metrics store.
	 * @param req The requirement to check
	 * @param metricsStore The metrics store to check the requirement with
	 * @returns Whether or not the requirement is met
	 */
	checkRequirement(req: AchievementMetricRequirement): boolean {
		let metric;
		switch (req.type) {
			case "comparison":
				metric = this.metricsStore.getMetric(req.metric);
				return (
					metric[req.comparisonType as keyof typeof metric] as (
						value: unknown,
						target: unknown,
						options?: unknown
					) => boolean
				)(this.metricsStore.getMetricValue(req.metric), req.value, req.options);
			case "and":
				return req.metrics.every((metric) => this.checkRequirement(metric));
			case "or":
				return req.metrics.some((metric) => this.checkRequirement(metric));
			case "not":
				return !this.checkRequirement(req.metric);
			case "never":
				return false;
		}
	}
}
