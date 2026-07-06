import { TestBed } from '@angular/core/testing';

import { AddProperty } from './add-property';

describe('AddProperty', () => {
  let service: AddProperty;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(AddProperty);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
