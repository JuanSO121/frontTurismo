import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';

import { Top10SitiosComponent } from './top10-sitios.component';

describe('Top10SitiosComponent', () => {
  let component: Top10SitiosComponent;
  let fixture: ComponentFixture<Top10SitiosComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      imports: [Top10SitiosComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(Top10SitiosComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  }));

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
