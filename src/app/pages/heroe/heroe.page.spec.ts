import { ComponentFixture, TestBed } from '@angular/core/testing';
import { HeroePage } from './heroe.page';

describe('HeroePage', () => {
  let component: HeroePage;
  let fixture: ComponentFixture<HeroePage>;

  beforeEach(() => {
    fixture = TestBed.createComponent(HeroePage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
