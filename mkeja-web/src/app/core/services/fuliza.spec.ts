import { TestBed } from '@angular/core/testing';

import { Fuliza } from './fuliza';

describe('Fuliza', () => {
  let service: Fuliza;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(Fuliza);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
