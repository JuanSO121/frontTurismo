import { ComponentFixture, TestBed } from '@angular/core/testing';
import { VisitaPage } from './visita.page';

describe('VisitaPage', () => {
  let component: VisitaPage;
  let fixture: ComponentFixture<VisitaPage>;

  beforeEach(() => {
    fixture = TestBed.createComponent(VisitaPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
