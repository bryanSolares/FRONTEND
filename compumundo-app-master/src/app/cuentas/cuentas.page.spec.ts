import { async, ComponentFixture, TestBed } from '@angular/core/testing';
import { IonicModule } from '@ionic/angular';

import { CuentasPage } from './cuentas.page';

describe('CuentasPage', () => {
  let component: CuentasPage;
  let fixture: ComponentFixture<CuentasPage>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ CuentasPage ],
      imports: [IonicModule.forRoot()]
    }).compileComponents();

    fixture = TestBed.createComponent(CuentasPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  }));

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
