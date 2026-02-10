import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable } from 'rxjs';
import { shareReplay, switchMap, tap } from 'rxjs/operators';
import type { Asset, AssetEvent } from '../models';

export type EventMeta = {
  workTypes: string[];
  users: Array<{
    login: string;
    displayName: string;
    avatarUrl: string | null;
  }>;
};

export type ProblemType = 'none' | 'warning' | 'alarm';

export type ReleasePayload = {
  workType: string;
  details?: string;
  problem: ProblemType;
};

@Injectable({ providedIn: 'root' })
export class AssetsService {
  private refresh$ = new BehaviorSubject<void>(undefined);

  readonly assets$: Observable<Asset[]> = this.refresh$.pipe(
    switchMap(() => this.http.get<Asset[]>('/api/assets')),
    shareReplay({ bufferSize: 1, refCount: true })
  );

  constructor(private http: HttpClient) {}

  refresh(): void {
    this.refresh$.next();
  }

  claim(id: string | number) {
    return this.http.post(`/api/assets/${encodeURIComponent(String(id))}/claim`, {}).pipe(
      tap(() => this.refresh())
    );
  }

  release(id: string | number, payload: ReleasePayload) {
    return this.http
      .post(`/api/assets/${encodeURIComponent(String(id))}/release`, payload)
      .pipe(tap(() => this.refresh()));
  }

  getAssets() {
    return this.http.get<Asset[]>('/api/assets');
  }

  getAsset(id: string | number) {
    return this.http.get<Asset>(`/api/assets/${encodeURIComponent(String(id))}`);
  }

  getEvents(assetId: string | number) {
    return this.http.get<AssetEvent[]>(`/api/assets/${encodeURIComponent(String(assetId))}/events`);
  }

  getEventsMeta(assetId: string | number) {
    return this.http.get<EventMeta>(`/api/assets/${encodeURIComponent(String(assetId))}/events/meta`);
  }

  getDeviceIcon(type: string | null | undefined): string {
    switch (type) {
      case 'box':
        return 'assets/devices/box.svg';
      case 'osmometr':
        return 'assets/devices/osmometr.svg';
      case 'recirculation':
        return 'assets/devices/recirculation.svg';
      default:
        return 'assets/devices/unknown-device.svg';
    }
  }
}
