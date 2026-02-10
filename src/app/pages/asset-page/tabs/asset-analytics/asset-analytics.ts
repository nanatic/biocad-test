import { Component, OnInit, HostListener, ElementRef, DestroyRef, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { combineLatest } from 'rxjs';
import { distinctUntilChanged, map, switchMap } from 'rxjs/operators';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

import { AssetsService, type EventMeta } from '../../../../shared/services/assets.service';
import { AnalyticsExportService } from '../../../../shared/services/analytics-export.service';
import type { AssetEvent } from '../../../../shared/models';

type Preset = 'day' | 'week' | '2w' | 'month' | '3m' | '6m' | 'custom';
type Pop = 'workType' | 'details' | 'user' | 'export' | null;

@Component({
  selector: 'app-asset-analytics',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './asset-analytics.html',
  styleUrl: './asset-analytics.scss',
})
export class AssetAnalytics implements OnInit {
  private readonly destroyRef = inject(DestroyRef);

  assetId = '';

  events: AssetEvent[] = [];
  visibleEvents: AssetEvent[] = [];

  from = '';
  to = '';
  preset: Preset = '2w';

  workTypeFilter = '';
  userFilter = '';
  detailsQuery = '';

  workTypes: string[] = [];
  users: string[] = [];

  sortDir: '↑' | '↓' = '↓';
  openPopover: Pop = null;

  constructor(
    private route: ActivatedRoute,
    private assetsService: AssetsService,
    private exportService: AnalyticsExportService,
    private el: ElementRef
  ) {}

  ngOnInit(): void {
    this.setPreset('2w');

    this.route.parent!.paramMap
      .pipe(
        map((pm) => pm.get('id') ?? ''),
        distinctUntilChanged(),
        switchMap((id) => {
          this.assetId = id;
          return combineLatest([
            this.assetsService.getEvents(id),
            this.assetsService.getEventsMeta(id),
          ]);
        }),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe(([ev, meta]) => {
        this.events = ev ?? [];

        const m: EventMeta | null = meta ?? null;
        this.workTypes = m?.workTypes ?? [];
        this.users = (m?.users ?? []).map((u) => u.login).filter(Boolean);

        this.workTypeFilter = '';
        this.userFilter = '';
        this.detailsQuery = '';
        this.openPopover = null;

        this.apply();
      });
  }

  @HostListener('document:click', ['$event'])
  onDocClick(ev: MouseEvent) {
    if (!this.openPopover) return;
    const target = ev.target as Node;
    if (!this.el.nativeElement.contains(target)) {
      this.openPopover = null;
    }
  }

  togglePopover(ev: MouseEvent, which: Exclude<Pop, null>) {
    ev.stopPropagation();
    this.openPopover = this.openPopover === which ? null : which;
  }

  setWorkType(v: string) {
    this.workTypeFilter = v;
    this.openPopover = null;
    this.apply();
  }

  setUser(login: string) {
    this.userFilter = login;
    this.openPopover = null;
    this.apply();
  }

  setPreset(p: Exclude<Preset, 'custom'>) {
    this.preset = p;

    const now = new Date();
    const to = now;
    const from = new Date(now);

    const days =
      p === 'day' ? 1 :
      p === 'week' ? 7 :
      p === '2w' ? 14 :
      p === 'month' ? 30 :
      p === '3m' ? 90 :
      180;

    from.setDate(from.getDate() - days);

    this.from = this.toLocalInput(from);
    this.to = this.toLocalInput(to);

    this.apply();
  }

  onCustomDatesChanged() {
    this.preset = 'custom';
    this.apply();
  }

  toggleSort() {
    this.sortDir = this.sortDir === '↓' ? '↑' : '↓';
    this.apply();
  }

  apply() {
    let out = [...this.events];

    const fromTs = this.from ? new Date(this.from).getTime() : NaN;
    const toTs = this.to ? new Date(this.to).getTime() : NaN;

    if (!Number.isNaN(fromTs)) out = out.filter((e) => new Date(e.ts).getTime() >= fromTs);
    if (!Number.isNaN(toTs)) out = out.filter((e) => new Date(e.ts).getTime() <= toTs);

    if (this.workTypeFilter) out = out.filter((e) => e.type === this.workTypeFilter);
    if (this.userFilter) out = out.filter((e) => e.userLogin === this.userFilter);

    if (this.detailsQuery.trim()) {
      const q = this.detailsQuery.trim().toLowerCase();
      out = out.filter((e) => (e.result ?? '').toLowerCase().includes(q));
    }

    out.sort((a, b) => {
      const aa = new Date(a.ts).getTime();
      const bb = new Date(b.ts).getTime();
      return this.sortDir === '↓' ? bb - aa : aa - bb;
    });

    this.visibleEvents = out;
  }

  formatTs(ts: string) {
    const d = new Date(ts);
    const pad = (n: number) => String(n).padStart(2, '0');
    const dd = pad(d.getDate());
    const mm = pad(d.getMonth() + 1);
    const yy = String(d.getFullYear()).slice(-2);
    const hh = pad(d.getHours());
    const mi = pad(d.getMinutes());
    return `${dd}.${mm}.${yy} / ${hh}:${mi}`;
  }

  exportPdf() {
    this.exportService.exportPdf({
      assetId: this.assetId,
      rangeLabel: this.getRangeLabel(),
      events: this.visibleEvents,
    });
    this.openPopover = null;
  }

  exportExcel() {
    this.exportService.exportCsvForExcel({
      assetId: this.assetId,
      rangeLabel: this.getRangeLabel(),
      events: this.visibleEvents,
    });
    this.openPopover = null;
  }

  private getRangeLabel(): string {
    return `${this.formatLocalInput(this.from)} — ${this.formatLocalInput(this.to)}`;
  }

  private formatLocalInput(v: string): string {
    if (!v) return '—';
    const d = new Date(v);
    if (Number.isNaN(d.getTime())) return '—';

    const pad = (n: number) => String(n).padStart(2, '0');
    const dd = pad(d.getDate());
    const mm = pad(d.getMonth() + 1);
    const yyyy = d.getFullYear();
    const hh = pad(d.getHours());
    const mi = pad(d.getMinutes());

    return `${dd}.${mm}.${yyyy} ${hh}:${mi}`;
  }

  private toLocalInput(d: Date) {
    const pad = (n: number) => String(n).padStart(2, '0');
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(
      d.getHours()
    )}:${pad(d.getMinutes())}`;
  }
}
