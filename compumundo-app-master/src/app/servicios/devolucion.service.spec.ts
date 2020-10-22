import { TestBed } from '@angular/core/testing';

import { DevolucionService } from './devolucion.service';

describe('DevolucionService', () => {
  beforeEach(() => TestBed.configureTestingModule({}));

  it('should be created', () => {
    const service: DevolucionService = TestBed.get(DevolucionService);
    expect(service).toBeTruthy();
  });
});
