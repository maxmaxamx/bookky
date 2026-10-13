import { Component, computed, model } from '@angular/core';
import { BANQUET_THRESHOLD, MAX_GUESTS, MIN_GUESTS } from '../../../../core/models/booking.model';
import { guestsLabel } from '../../../../core/utils/date.util';

@Component({
  selector: 'app-guest-counter',
  styleUrl: './guest-counter.scss',
  templateUrl: './guest-counter.html',
})
export class GuestCounter {
  readonly value = model.required<number>();

  protected readonly min = MIN_GUESTS;
  protected readonly max = MAX_GUESTS;
  protected readonly banquetThreshold = BANQUET_THRESHOLD;
  protected readonly presets = [2, 4, 6, 8];

  protected readonly label = computed(() => guestsLabel(this.value()));
  protected readonly canDecrease = computed(() => this.value() > this.min);
  protected readonly canIncrease = computed(() => this.value() < this.max);

  protected change(delta: number): void {
    const next = Math.min(this.max, Math.max(this.min, this.value() + delta));
    if (next !== this.value()) {
      this.value.set(next);
    }
  }

  protected setGuests(count: number): void {
    if (count !== this.value()) {
      this.value.set(count);
    }
  }

  protected presetClass(count: number): string {
    return this.value() === count ? 'gc-preset gc-preset--on' : 'gc-preset gc-preset--idle';
  }
}
