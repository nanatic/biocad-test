import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AssetDescription } from './asset-description';

describe('AssetDescription', () => {
  let component: AssetDescription;
  let fixture: ComponentFixture<AssetDescription>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AssetDescription]
    })
    .compileComponents();

    fixture = TestBed.createComponent(AssetDescription);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
