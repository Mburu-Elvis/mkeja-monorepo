import { TestBed } from '@angular/core/testing';

import { Landlord } from './landlord';

describe('Landlord', () => {
  let service: Landlord;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(Landlord);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
