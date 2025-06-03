import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';

import { RankingFamososComponent } from './ranking-famosos.component';

describe('RankingFamososComponent', () => {
  let component: RankingFamososComponent;
  let fixture: ComponentFixture<RankingFamososComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      imports: [RankingFamososComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(RankingFamososComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  }));

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
