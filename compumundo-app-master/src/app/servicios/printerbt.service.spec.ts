import { TestBed } from '@angular/core/testing';

import { PrinterbtService } from './printerbt.service';

describe('PrinterbtService', () => {
  beforeEach(() => TestBed.configureTestingModule({}));

  it('should be created', () => {
    const service: PrinterbtService = TestBed.get(PrinterbtService);
    expect(service).toBeTruthy();
  });
});
