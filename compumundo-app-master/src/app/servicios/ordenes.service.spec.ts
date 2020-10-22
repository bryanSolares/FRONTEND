import { TestBed } from '@angular/core/testing';

import { OrdenesService } from './ordenes.service';

describe('OrdenesService', () => {
  beforeEach(() => TestBed.configureTestingModule({}));

  it('should be created', () => {
    const service: OrdenesService = TestBed.get(OrdenesService);
    expect(service).toBeTruthy();
  });
});
