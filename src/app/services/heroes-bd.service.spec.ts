import { TestBed } from '@angular/core/testing';

import { HeroesBDService } from './heroes-bd.service';

describe('HeroesBDService', () => {
  let service: HeroesBDService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(HeroesBDService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
