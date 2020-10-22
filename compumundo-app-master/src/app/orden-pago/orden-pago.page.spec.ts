import { async, ComponentFixture, TestBed } from '@angular/core/testing';
import { IonicModule } from '@ionic/angular';

import { OrdenPagoPage } from './orden-pago.page';

describe('OrdenPagoPage', () => {
  let component: OrdenPagoPage;
  let fixture: ComponentFixture<OrdenPagoPage>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ OrdenPagoPage ],
      imports: [IonicModule.forRoot()]
    }).compileComponents();

    fixture = TestBed.createComponent(OrdenPagoPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  }));

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
