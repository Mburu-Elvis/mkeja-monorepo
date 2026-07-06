import { TestBed } from '@angular/core/testing';

import { Ratiba } from './ratiba';

describe('Ratiba', () => {
  let service: Ratiba;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(Ratiba);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
