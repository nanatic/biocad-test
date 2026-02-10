import { Component, DestroyRef, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

import { AssetContextService } from '../../../../shared/services/asset-context.service';
import type { Asset } from '../../../../shared/models';

@Component({
  selector: 'app-asset-description',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './asset-description.html',
  styleUrl: './asset-description.scss',
})
export class AssetDescription implements OnInit {
  private destroyRef = inject(DestroyRef);
  asset: Asset | null = null;

  constructor(private assetCtx: AssetContextService) {}

  ngOnInit(): void {
    this.assetCtx.asset$
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((a) => {
        this.asset = a;
      });
  }
}
