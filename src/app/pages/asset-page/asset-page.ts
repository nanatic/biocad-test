import { Component, OnInit, ChangeDetectorRef, DestroyRef, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  ActivatedRoute,
  Router,
  RouterOutlet,
  RouterLink,
  RouterLinkActive,
} from '@angular/router';
import { FormsModule } from '@angular/forms';
import { finalize, map } from 'rxjs/operators';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

import type { Asset } from '../../shared/models';
import {
  AssetsService,
  type ProblemType,
  type ReleasePayload,
} from '../../shared/services/assets.service';
import { AssetContextService } from '../../shared/services/asset-context.service';

@Component({
  selector: 'app-asset-page',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, RouterLinkActive, RouterOutlet],
  templateUrl: './asset-page.html',
  styleUrl: './asset-page.scss',
})
export class AssetPage implements OnInit {
  private destroyRef = inject(DestroyRef);

  assetId = '';
  asset: Asset | null = null;

  isFav = false;
  deviceIconUrl = 'assets/devices/unknown-device.svg';

  actionLoading = false;
  actionError = '';

  releaseFormOpen = false;
  releaseForm: ReleasePayload = {
    workType: '',
    details: '',
    problem: 'none',
  };

  private readonly defaultWorkTypes = [
    'Калибровка',
    'Диагностика',
    'Плановое обслуживание',
    'Ремонт',
  ];
  workTypes: string[] = [...this.defaultWorkTypes];

  private releaseRequestedFromQuery = false;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private assetCtx: AssetContextService,
    private assetsService: AssetsService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.assetCtx.currentAssetId$
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((id) => {
        this.assetId = id;
      });

    this.assetCtx.asset$
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((a) => {
        this.asset = a;
        this.deviceIconUrl = this.assetsService.getDeviceIcon(a?.type);

        if (this.releaseRequestedFromQuery && a.status === 'busy' && a.isMine) {
          this.openReleaseForm();
        }

        this.cdr.markForCheck();
      });

    this.assetCtx.eventsMeta$
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((meta) => {
        const dynamic = (meta?.workTypes ?? []).filter((x) => x && x !== 'Занятие');
        this.workTypes = Array.from(new Set([...this.defaultWorkTypes, ...dynamic]));
      });

    this.route.queryParamMap
      .pipe(
        map((q) => q.get('release') === '1'),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe((flag) => {
        this.releaseRequestedFromQuery = flag;
        if (flag && this.asset?.status === 'busy' && this.asset.isMine) {
          this.openReleaseForm();
        }
      });
  }

  get canSubmitRelease(): boolean {
    return !!this.releaseForm.workType?.trim() && !this.actionLoading;
  }

  toggleFav() {
    this.isFav = !this.isFav;
  }

  onClaim() {
    if (!this.asset || this.asset.status !== 'free' || this.actionLoading) return;

    this.actionError = '';
    this.actionLoading = true;

    this.assetCtx
      .claimCurrent()
      .pipe(
        finalize(() => {
          this.actionLoading = false;
          this.cdr.markForCheck();
        }),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe({
        error: (e) => {
          this.actionError = e?.error?.error || 'Не удалось занять устройство';
        },
      });
  }

  openReleaseForm() {
    if (!this.asset || this.asset.status !== 'busy' || !this.asset.isMine) return;
    this.actionError = '';
    this.releaseFormOpen = true;
  }

  closeReleaseForm() {
    this.releaseFormOpen = false;
    this.resetReleaseForm();
    this.clearReleaseQueryParam();
  }

  submitRelease() {
    if (!this.canSubmitRelease) return;

    this.actionError = '';
    this.actionLoading = true;

    const payload: ReleasePayload = {
      workType: this.releaseForm.workType.trim(),
      details: this.releaseForm.details?.trim() || '',
      problem: this.releaseForm.problem as ProblemType,
    };

    this.assetCtx
      .releaseCurrent(payload)
      .pipe(
        finalize(() => {
          this.actionLoading = false;
          this.cdr.markForCheck();
        }),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe({
        next: () => {
          this.releaseFormOpen = false;
          this.resetReleaseForm();
          this.clearReleaseQueryParam();
        },
        error: (e) => {
          this.actionError = e?.error?.error || 'Не удалось освободить устройство';
        },
      });
  }

  private resetReleaseForm() {
    this.releaseForm = { workType: '', details: '', problem: 'none' };
  }

  private clearReleaseQueryParam() {
    if (!this.releaseRequestedFromQuery) return;

    this.router.navigate([], {
      relativeTo: this.route,
      queryParams: { release: null },
      queryParamsHandling: 'merge',
      replaceUrl: true,
    });

    this.releaseRequestedFromQuery = false;
  }
}
