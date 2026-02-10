import { ResolveFn } from '@angular/router';
import { inject } from '@angular/core';
import { of } from 'rxjs';
import { map, take } from 'rxjs/operators';
import { AssetContextService } from '../services/asset-context.service';

export const assetContextResolver: ResolveFn<boolean> = (route) => {
  const id = route.paramMap.get('id') ?? '';
  if (!id) return of(false);

  const ctx = inject(AssetContextService);
  ctx.setAssetId(id);

  return ctx.asset$.pipe(
    take(1),
    map(() => true)
  );
};
