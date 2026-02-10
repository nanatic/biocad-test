import { Component, DestroyRef, HostListener, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NavigationEnd, Router, RouterLink, RouterLinkActive } from '@angular/router';
import { Observable, firstValueFrom } from 'rxjs';
import { distinctUntilChanged, filter, map, startWith } from 'rxjs/operators';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

import { UserService, MeUser } from '../../shared/services/user.service';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [CommonModule, RouterLink, RouterLinkActive],
  templateUrl: './header.html',
  styleUrl: './header.scss',
})
export class Header {
  private destroyRef = inject(DestroyRef);

  navOpen = false;
  currentAssetId: string | null = null;

  me$!: Observable<MeUser>;

  constructor(private userService: UserService, private router: Router) {
    this.me$ = this.userService.me$;

    this.router.events
      .pipe(
        filter((e): e is NavigationEnd => e instanceof NavigationEnd),
        startWith(new NavigationEnd(0, this.router.url, this.router.url)),
        map((e) => e.urlAfterRedirects || e.url),
        map((url) => {
          const m = url.match(/\/asset\/([^/?#]+)/);
          return m ? decodeURIComponent(m[1]) : null;
        }),
        distinctUntilChanged(),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe((id) => {
        this.currentAssetId = id;
      });
  }

  @HostListener('document:keydown.escape')
  onEsc() {
    this.closeNav();
  }

  toggleNav() {
    this.navOpen = !this.navOpen;
  }

  closeNav() {
    this.navOpen = false;
  }

  async onAvatarSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) return;

    try {
      await firstValueFrom(this.userService.uploadMyAvatar(file));
      this.closeNav();
    } finally {
      input.value = '';
    }
  }
}
