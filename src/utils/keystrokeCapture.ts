export type InputMethod = "physical-keyboard" | "virtual-keyboard" | "unknown";

export interface DeviationStats {
  mean: number;
  stdDev: number;
}

export interface RhythmStats {
  coefficientOfVariation: number;
  rolloverRate: number;
}

export interface ErrorsAndPausesStats {
  backspaceRate: number;
  longestPause: number;
}

export interface KeystrokeFeatures {
  schemaVersion: 1;
  inputMethod: InputMethod;
  dwell: DeviationStats;
  flight: DeviationStats;
  rhythm: RhythmStats;
  errorsAndPauses: ErrorsAndPausesStats;
  totalKeystrokes: number;
}

export class KeystrokeCollector {
  private keyDownTimes: Map<string, number> = new Map();
  private dwellTimes: number[] = [];
  private flightTimes: number[] = [];
  private totalKeystrokes: number = 0;
  private backspaceCount: number = 0;
  private lastKeyUpTime: number | null = null;
  private longestPause: number = 0;
  private rolloverCount: number = 0;
  private inputMethod: InputMethod = "physical-keyboard";

  public onKeyDown(event: React.KeyboardEvent | KeyboardEvent): void {
    const key = event.key;
    const now = performance.now();

    const isComposing =
      ('nativeEvent' in event ? event.nativeEvent.isComposing : event.isComposing) || false;
    if (isComposing || key === "Unidentified") {
      this.inputMethod = "virtual-keyboard";
    }

    if (this.keyDownTimes.size > 0 && !this.keyDownTimes.has(key)) {
      this.rolloverCount += 1;
    }

    if (!this.keyDownTimes.has(key)) {
      this.keyDownTimes.set(key, now);
    }

    if (this.lastKeyUpTime !== null) {
      const pause = now - this.lastKeyUpTime;
      if (pause > this.longestPause) {
        this.longestPause = pause;
      }
      this.flightTimes.push(pause);
    }
  }

  public onKeyUp(event: React.KeyboardEvent | KeyboardEvent): void {
    const key = event.key;
    const now = performance.now();

    if (this.keyDownTimes.has(key)) {
      const downTime = this.keyDownTimes.get(key)!;
      const dwell = now - downTime;
      this.dwellTimes.push(dwell);
      this.totalKeystrokes += 1;
      this.keyDownTimes.delete(key);
    }

    if (key === "Backspace") {
      this.backspaceCount += 1;
    }

    this.lastKeyUpTime = now;
  }

  private calculateDeviation(data: number[]): DeviationStats {
    if (data.length === 0) {
      return { mean: 0, stdDev: 0 };
    }
    const mean = data.reduce((sum, val) => sum + val, 0) / data.length;
    if (data.length < 2) {
      return { mean: Number(mean.toFixed(2)), stdDev: 0 };
    }
    const variance =
      data.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / data.length;
    const stdDev = Math.sqrt(variance);
    return {
      mean: Number(mean.toFixed(2)),
      stdDev: Number(stdDev.toFixed(2)),
    };
  }

  public getFeatures(): KeystrokeFeatures {
    const dwellStats = this.calculateDeviation(this.dwellTimes);
    const flightStats = this.calculateDeviation(this.flightTimes);

    const coefficientOfVariation =
      dwellStats.mean > 0
        ? Number((dwellStats.stdDev / dwellStats.mean).toFixed(4))
        : 0;

    const rolloverRate =
      this.totalKeystrokes > 0
        ? Number((this.rolloverCount / this.totalKeystrokes).toFixed(4))
        : 0;

    const backspaceRate =
      this.totalKeystrokes > 0
        ? Number((this.backspaceCount / this.totalKeystrokes).toFixed(4))
        : 0;

    return {
      schemaVersion: 1,
      inputMethod: this.inputMethod,
      dwell: dwellStats,
      flight: flightStats,
      rhythm: {
        coefficientOfVariation,
        rolloverRate,
      },
      errorsAndPauses: {
        backspaceRate,
        longestPause: Number(this.longestPause.toFixed(2)),
      },
      totalKeystrokes: this.totalKeystrokes,
    };
  }

  public reset(): void {
    this.keyDownTimes.clear();
    this.dwellTimes = [];
    this.flightTimes = [];
    this.totalKeystrokes = 0;
    this.backspaceCount = 0;
    this.lastKeyUpTime = null;
    this.longestPause = 0;
    this.rolloverCount = 0;
    this.inputMethod = "physical-keyboard";
  }
}
