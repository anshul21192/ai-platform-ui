/**
 * Keystroke dynamics: types + capture utility.
 *
 * Design goal: only aggregate statistics ever leave the browser.
 * Raw per-keystroke timestamps and literal key values live only in
 * memory during the session and are discarded once features are computed.
 */

// ---------- Types ----------

export type KeyCategory =
  | 'letter'
  | 'digit'
  | 'punctuation'
  | 'space'
  | 'backspace'
  | 'delete'
  | 'enter'
  | 'tab'
  | 'modifier'
  | 'arrow'
  | 'other';

export type InputMethod = 'physical-keyboard' | 'virtual-keyboard' | 'unknown';

/** Shared shape for dwell/flight distributions. */
export interface DistributionStats {
  mean: number;
  stdDev: number;
  median: number;
  p95: number;
  min: number;
  max: number;
  /** Observations backing this stat. Treat as unreliable below ~15-20. */
  sampleSize: number;
}

export interface KeystrokeFeatures {
  schemaVersion: 1;
  /** ISO timestamp — lets a server-side check flag stale/replayed payloads. */
  capturedAt: string;
  inputMethod: InputMethod;

  // Overall
  typingSpeed: number; // characters per minute
  totalKeystrokes: number;
  sessionDuration: number; // ms

  // Dwell (key hold time, ms)
  dwell: DistributionStats;

  // Flight (up-to-down latency between keys, ms)
  flight: DistributionStats;

  // Errors / corrections
  backspaceCount: number;
  deleteCount: number;
  backspaceRate: number; // per 100 keystrokes
  /** Consecutive-correction groups — distinguishes one typo from repeated hesitation. */
  correctionBursts: number;

  // Pauses
  pauseCount: number;
  averagePauseDuration: number;
  longestPause: number;

  // Rhythm / automation indicators
  burstiness: number; // Goh-Barabasi parameter, range [-1, 1]
  rolloverRate: number; // overlapping key presses, per keystroke
  coefficientOfVariation: number; // flight stdDev/mean — near-zero is a bot red flag

  /** Coarse key-type counts. Never literal keys/text — safe to include or drop. */
  keyCategoryDistribution?: Partial<Record<KeyCategory, number>>;
}

// ---------- Capture ----------

interface PendingKey {
  category: KeyCategory;
  downAt: number;
}

export interface KeystrokeCaptureOptions {
  /** Gap (ms) beyond which a flight interval counts as a pause. Default 2000. */
  pauseThresholdMs?: number;
  /** Gap (ms) that separates one correction burst from the next. Default 1500. */
  correctionBurstGapMs?: number;
  inputMethod?: InputMethod;
}

export class KeystrokeCapture {
  private el: HTMLElement;
  private opts: Required<KeystrokeCaptureOptions>;

  private sessionStart = 0;
  private lastKeyUpAt: number | null = null;
  private pendingByCode = new Map<string, PendingKey[]>();

  private dwellSamples: number[] = [];
  private flightSamples: number[] = [];
  private pauseSamples: number[] = [];

  private totalKeystrokes = 0;
  private backspaceCount = 0;
  private deleteCount = 0;
  private rolloverEvents = 0;
  private correctionBursts = 0;
  private lastWasCorrection = false;
  private lastCorrectionAt = 0;
  private keyCategoryCounts: Partial<Record<KeyCategory, number>> = {};

  private onKeyDown = (e: KeyboardEvent) => this.handleKeyDown(e);
  private onKeyUp = (e: KeyboardEvent) => this.handleKeyUp(e);

  constructor(el: HTMLElement, options: KeystrokeCaptureOptions = {}) {
    this.el = el;
    this.opts = {
      pauseThresholdMs: options.pauseThresholdMs ?? 2000,
      correctionBurstGapMs: options.correctionBurstGapMs ?? 1500,
      inputMethod: options.inputMethod ?? 'unknown',
    };
  }

  start(): void {
    this.sessionStart = performance.now();
    this.el.addEventListener('keydown', this.onKeyDown);
    this.el.addEventListener('keyup', this.onKeyUp);
  }

  /** Stops listening and returns the computed aggregate features. */
  stop(): KeystrokeFeatures {
    this.el.removeEventListener('keydown', this.onKeyDown);
    this.el.removeEventListener('keyup', this.onKeyUp);
    return this.computeFeatures();
  }

  /**
   * Buckets a key into a broad category using e.key transiently.
   * The literal value is never stored — only the category counter is retained.
   */
  private categorize(e: KeyboardEvent): KeyCategory {
    if (e.key === 'Backspace') return 'backspace';
    if (e.key === 'Delete') return 'delete';
    if (e.key === 'Enter') return 'enter';
    if (e.key === 'Tab') return 'tab';
    if (e.key === ' ') return 'space';
    if (e.key.startsWith('Arrow')) return 'arrow';
    if (['Shift', 'Control', 'Alt', 'Meta', 'CapsLock'].includes(e.key)) return 'modifier';
    if (/^[0-9]$/.test(e.key)) return 'digit';
    if (/^[a-zA-Z]$/.test(e.key)) return 'letter';
    if (e.key.length === 1) return 'punctuation';
    return 'other';
  }

  private handleKeyDown(e: KeyboardEvent): void {
    const now = performance.now();
    const category = this.categorize(e);

    // True rollover: another key is still down when this one lands.
    if (this.pendingByCode.size > 0) {
      this.rolloverEvents++;
    }

    // Flight time: gap since the previous key was released.
    if (this.lastKeyUpAt !== null) {
      const gap = now - this.lastKeyUpAt;
      if (gap >= 0) {
        this.flightSamples.push(gap);
        if (gap > this.opts.pauseThresholdMs) {
          this.pauseSamples.push(gap);
        }
      }
    }

    const queue = this.pendingByCode.get(e.code) ?? [];
    queue.push({ category, downAt: now });
    this.pendingByCode.set(e.code, queue);

    this.totalKeystrokes++;
    this.keyCategoryCounts[category] = (this.keyCategoryCounts[category] ?? 0) + 1;

    if (category === 'backspace' || category === 'delete') {
      if (category === 'backspace') this.backspaceCount++;
      if (category === 'delete') this.deleteCount++;

      if (!this.lastWasCorrection || now - this.lastCorrectionAt > this.opts.correctionBurstGapMs) {
        this.correctionBursts++;
      }
      this.lastWasCorrection = true;
      this.lastCorrectionAt = now;
    } else {
      this.lastWasCorrection = false;
    }
  }

  private handleKeyUp(e: KeyboardEvent): void {
    const now = performance.now();
    const queue = this.pendingByCode.get(e.code);
    if (queue && queue.length > 0) {
      const pending = queue.shift()!;
      this.dwellSamples.push(now - pending.downAt);
      if (queue.length === 0) this.pendingByCode.delete(e.code);
    }
    this.lastKeyUpAt = now;
  }

  private computeFeatures(): KeystrokeFeatures {
    const sessionDuration = performance.now() - this.sessionStart;
    const dwell = this.distributionStats(this.dwellSamples);
    const flight = this.distributionStats(this.flightSamples);

    const flightMean = flight.mean || 1; // guard divide-by-zero
    const coefficientOfVariation = flight.stdDev / flightMean;

    const burstiness =
      flight.stdDev + flight.mean === 0
        ? 0
        : (flight.stdDev - flight.mean) / (flight.stdDev + flight.mean);

    return {
      schemaVersion: 1,
      capturedAt: new Date().toISOString(),
      inputMethod: this.opts.inputMethod,

      typingSpeed: sessionDuration > 0 ? (this.totalKeystrokes / sessionDuration) * 60000 : 0,
      totalKeystrokes: this.totalKeystrokes,
      sessionDuration,

      dwell,
      flight,

      backspaceCount: this.backspaceCount,
      deleteCount: this.deleteCount,
      backspaceRate:
        this.totalKeystrokes > 0 ? (this.backspaceCount / this.totalKeystrokes) * 100 : 0,
      correctionBursts: this.correctionBursts,

      pauseCount: this.pauseSamples.length,
      averagePauseDuration: this.mean(this.pauseSamples),
      longestPause: this.pauseSamples.length ? Math.max(...this.pauseSamples) : 0,

      burstiness,
      rolloverRate: this.totalKeystrokes > 0 ? this.rolloverEvents / this.totalKeystrokes : 0,
      coefficientOfVariation,

      keyCategoryDistribution: this.keyCategoryCounts,
    };
  }

  // ---- stats helpers ----

  private mean(xs: number[]): number {
    return xs.length ? xs.reduce((a, b) => a + b, 0) / xs.length : 0;
  }

  private stdDev(xs: number[], m: number): number {
    if (xs.length < 2) return 0;
    const variance = xs.reduce((sum, x) => sum + (x - m) ** 2, 0) / (xs.length - 1);
    return Math.sqrt(variance);
  }

  private percentile(xs: number[], p: number): number {
    if (!xs.length) return 0;
    const sorted = [...xs].sort((a, b) => a - b);
    const idx = Math.min(sorted.length - 1, Math.floor((p / 100) * sorted.length));
    return sorted[idx];
  }

  private distributionStats(xs: number[]): DistributionStats {
    const m = this.mean(xs);
    return {
      mean: m,
      stdDev: this.stdDev(xs, m),
      median: this.percentile(xs, 50),
      p95: this.percentile(xs, 95),
      min: xs.length ? Math.min(...xs) : 0,
      max: xs.length ? Math.max(...xs) : 0,
      sampleSize: xs.length,
    };
  }
}
