import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable } from 'rxjs';
import { switchMap, map, shareReplay, tap } from 'rxjs/operators';

export type MeUser = {
  id: number;
  login: string;
  displayName: string;
  avatarUrl: string | null;
};

@Injectable({ providedIn: 'root' })
export class UserService {
  private refresh$ = new BehaviorSubject<void>(undefined);

  readonly me$: Observable<MeUser> = this.refresh$.pipe(
    switchMap(() => this.http.get<MeUser>('/api/users/me')),
    map((u) => ({
      ...u,
      avatarUrl: u.avatarUrl ? `${u.avatarUrl}?v=${Date.now()}` : null,
    })),
    shareReplay({ bufferSize: 1, refCount: true })
  );

  constructor(private http: HttpClient) {}

  refreshMe(): void {
    this.refresh$.next();
  }

  uploadMyAvatar(file: File) {
    const form = new FormData();
    form.append('avatar', file);

    return this.http.post<{ avatarUrl: string | null }>('/api/users/me/avatar', form).pipe(
      tap(() => this.refreshMe())
    );
  }
}
