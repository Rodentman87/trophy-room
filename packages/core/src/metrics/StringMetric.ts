import { BaseMetric } from "./BaseMetric";

interface StringComparisonOptions {
    ignoreCase?: boolean
}

export class StringMetric<ID extends string> extends BaseMetric<
    ID,
    string,
    string
> {
    transform(values: [string, string | string[]], options: StringComparisonOptions | undefined): [string, string[]] {
        let value = values[0];
        let target = Array.isArray(values[1]) ? values[1] : [values[1]];

        if (options?.ignoreCase) {
            value = value.toLowerCase();
            target = target.map(x => x.toLowerCase());
        }

        return [value, target];
    }

    // `options` is ignored if `target` is a regular expression. 
	matchesOneOf(rawValue: string, rawTarget: string | string[] | RegExp, options?: StringComparisonOptions): boolean {
        if (rawTarget instanceof RegExp) {
            return rawTarget.test(rawValue);
        }

        const [value, targets] = this.transform([rawValue, rawTarget], options);
        return targets.some(target => value === target);
    }

    includesOneOf(rawValue: string, rawTarget: string | string[], options?: StringComparisonOptions): boolean {
        const [value, targets] = this.transform([rawValue, rawTarget], options);
        return targets.some(target => value.includes(target));
    }

    startsWithOneOf(rawValue: string, rawTarget: string | string[], options?: StringComparisonOptions): boolean {
        const [value, targets] = this.transform([rawValue, rawTarget], options);
        return targets.some(target => value.startsWith(target));
    }

    endsWithOneOf(rawValue: string, rawTarget: string | string[], options?: StringComparisonOptions): boolean {
        const [value, targets] = this.transform([rawValue, rawTarget], options);
        return targets.some(target => value.endsWith(target));
    }
}
