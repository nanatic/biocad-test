import {
  Component,
  Input,
  EventEmitter,
  Output,
  ElementRef,
  Renderer2,
  OnDestroy,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import type { Asset } from '../../models';

@Component({
  selector: 'app-asset-card',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './asset-card.html',
  styleUrl: './asset-card.scss',
})
export class AssetCard implements OnDestroy {
  @Input({ required: true }) asset!: Asset;

  @Output() claim = new EventEmitter<Asset>();
  @Output() release = new EventEmitter<Asset>();

  menuOpen = false;
  private removeDocClick?: () => void;

  constructor(
    private el: ElementRef,
    private renderer: Renderer2
  ) {}

  ngOnDestroy(): void {
    this.detachDocClick();
  }

  toggleMenu(event: MouseEvent) {
    event.stopPropagation();
    event.preventDefault();

    this.menuOpen = !this.menuOpen;

    if (this.menuOpen) this.attachDocClick();
    else this.detachDocClick();
  }

  closeMenu() {
    this.menuOpen = false;
    this.detachDocClick();
  }

  onClaim(event: MouseEvent) {
    event.stopPropagation();
    event.preventDefault();
    this.claim.emit(this.asset);
    this.closeMenu();
  }

  onRelease(event: MouseEvent) {
    event.stopPropagation();
    event.preventDefault();
    this.release.emit(this.asset);
    this.closeMenu();
  }

  private attachDocClick() {
    if (this.removeDocClick) return;

    this.removeDocClick = this.renderer.listen('document', 'click', (event: MouseEvent) => {
      if (!this.menuOpen) return;

      const target = event.target as Node;
      if (!this.el.nativeElement.contains(target)) {
        this.closeMenu();
      }
    });
  }

  private detachDocClick() {
    if (!this.removeDocClick) return;
    this.removeDocClick();
    this.removeDocClick = undefined;
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
