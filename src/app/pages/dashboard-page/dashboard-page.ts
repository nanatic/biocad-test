import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { firstValueFrom, Observable } from 'rxjs';
import { Router } from '@angular/router';

import { AssetCard } from '../../shared/components/asset-card/asset-card';
import { AssetsService } from '../../shared/services/assets.service';
import type { Asset } from '../../shared/models';

@Component({
  selector: 'app-dashboard-page',
  standalone: true,
  imports: [CommonModule, AssetCard],
  templateUrl: './dashboard-page.html',
  styleUrl: './dashboard-page.scss',
})
export class DashboardPage {
  assets$!: Observable<Asset[]>;

  constructor(private assetsService: AssetsService, private router: Router) {
    this.assets$ = this.assetsService.assets$;
  }

  trackById = (_: number, a: Asset) => a.id;

  async onClaim(asset: Asset): Promise<void> {
    await firstValueFrom(this.assetsService.claim(asset.id));
  }

  async onRelease(asset: Asset): Promise<void> {
    await this.router.navigate(['/asset', asset.id, 'description'], {
      queryParams: { release: '1' },
    });
  }
}
