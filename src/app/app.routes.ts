import { Routes } from '@angular/router';

import { DashboardPage } from './pages/dashboard-page/dashboard-page';
import { AssetPage } from './pages/asset-page/asset-page';
import { AssetDescription } from './pages/asset-page/tabs/asset-description/asset-description';
import { AssetAnalytics } from './pages/asset-page/tabs/asset-analytics/asset-analytics';
import { ErrorPage } from './pages/error-page/error-page';
import { assetContextResolver } from './shared/resolvers/asset-context.resolver';

export const routes: Routes = [
  { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
  { path: 'dashboard', component: DashboardPage },

  {
    path: 'asset/:id',
    component: AssetPage,
    resolve: { ready: assetContextResolver },
    children: [
      { path: '', redirectTo: 'description', pathMatch: 'full' },
      { path: 'description', component: AssetDescription },
      { path: 'analytics', component: AssetAnalytics },
    ],
  },

  { path: 'error', component: ErrorPage },
  { path: '**', redirectTo: 'error' },
];
