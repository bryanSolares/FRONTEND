import { TestBed } from '@angular/core/testing';

import { FirebaseMethodsService } from './firebase-methods.service';

describe('FirebaseMethodsService', () => {
  beforeEach(() => TestBed.configureTestingModule({}));

  it('should be created', () => {
    const service: FirebaseMethodsService = TestBed.get(FirebaseMethodsService);
    expect(service).toBeTruthy();
  });
});
