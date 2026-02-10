import { Injectable } from '@angular/core';
import { BehaviorSubject, combineLatest, throwError } from 'rxjs';
import { distinctUntilChanged, filter, shareReplay, switchMap, tap } from 'rxjs/operators';

import type { Asset } from '../models';
import { AssetsService, type ReleasePayload } from './assets.service';

@Injectable({ providedIn: 'root' })
export class AssetContextService {
  private readonly assetId$ = new BehaviorSubject<string>('');
  private readonly refresh$ = new BehaviorSubject<void>(undefined);

  readonly currentAssetId$ = this.assetId$.pipe(
    filter(Boolean),
    distinctUntilChanged(),
    shareReplay({ bufferSize: 1, refCount: true })
  );

  readonly asset$ = combineLatest([this.currentAssetId$, this.refresh$]).pipe(
    switchMap(([id]) => this.assetsService.getAsset(id)),
    shareReplay({ bufferSize: 1, refCount: true })
  );

  readonly events$ = combineLatest([this.currentAssetId$, this.refresh$]).pipe(
    switchMap(([id]) => this.assetsService.getEvents(id)),
    shareReplay({ bufferSize: 1, refCount: true })
  );

  readonly eventsMeta$ = combineLatest([this.currentAssetId$, this.refresh$]).pipe(
    switchMap(([id]) => this.assetsService.getEventsMeta(id)),
    shareReplay({ bufferSize: 1, refCount: true })
  );

  constructor(private assetsService: AssetsService) {}

  setAssetId(id: string) {
    if (!id) return;
    this.assetId$.next(id);
    this.refresh();
  }

  refresh() {
    this.refresh$.next();
  }

  claimCurrent() {
    const id = this.assetId$.value;
    if (!id) return throwError(() => new Error('assetId not set'));
    return this.assetsService.claim(id).pipe(tap(() => this.refresh()));
  }

  releaseCurrent(payload: ReleasePayload) {
    const id = this.assetId$.value;
    if (!id) return throwError(() => new Error('assetId not set'));
    return this.assetsService.release(id, payload).pipe(tap(() => this.refresh()));
  }
}
