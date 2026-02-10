import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AssetAnalytics } from './asset-analytics';

describe('AssetAnalytics', () => {
  let component: AssetAnalytics;
  let fixture: ComponentFixture<AssetAnalytics>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AssetAnalytics]
    })
    .compileComponents();

    fixture = TestBed.createComponent(AssetAnalytics);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
