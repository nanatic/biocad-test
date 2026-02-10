import { ResolveFn } from '@angular/router';
import { inject } from '@angular/core';
import { AssetsService } from '../services/assets.service';
import type { Asset } from '../models';

export const assetResolver: ResolveFn<Asset> = (route) => {
  const id = route.paramMap.get('id') ?? '';
  return inject(AssetsService).getAsset(id);
};
