import { async, ComponentFixture, TestBed } from '@angular/core/testing';
import { IonicModule } from '@ionic/angular';

import { AgregarFacturasPage } from './agregar-facturas.page';

describe('AgregarFacturasPage', () => {
  let component: AgregarFacturasPage;
  let fixture: ComponentFixture<AgregarFacturasPage>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ AgregarFacturasPage ],
      imports: [IonicModule.forRoot()]
    }).compileComponents();

    fixture = TestBed.createComponent(AgregarFacturasPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  }));

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
