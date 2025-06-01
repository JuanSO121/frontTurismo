import { TestBed } from '@angular/core/testing';

import { FamososService } from './famosos.service';

describe('FamososService', () => {
  let service: FamososService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(FamososService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
