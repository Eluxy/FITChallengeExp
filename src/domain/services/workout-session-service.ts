export class WorkoutSessionService {
  private timerRef: ReturnType<typeof setInterval> | null = null;
  private _elapsed = 0;
  private onTick: (elapsed: number) => void;

  constructor(onTick: (elapsed: number) => void) {
    this.onTick = onTick;
  }

  start(): void {
    this._elapsed = 0;
    this.timerRef = setInterval(() => {
      this._elapsed += 1;
      this.onTick(this._elapsed);
    }, 1000);
  }

  pause(): void {
    this.stop();
  }

  resume(): void {
    if (this.timerRef) return;
    this.timerRef = setInterval(() => {
      this._elapsed += 1;
      this.onTick(this._elapsed);
    }, 1000);
  }

  stop(): void {
    if (this.timerRef) {
      clearInterval(this.timerRef);
      this.timerRef = null;
    }
  }

  get elapsed(): number {
    return this._elapsed;
  }

  reset(): void {
    this.stop();
    this._elapsed = 0;
  }
}
