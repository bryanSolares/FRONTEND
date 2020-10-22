import { async, ComponentFixture, TestBed } from '@angular/core/testing';
import { IonicModule } from '@ionic/angular';

import { OrdenDeVentaPage } from './orden-de-venta.page';

describe('OrdenDeVentaPage', () => {
  let component: OrdenDeVentaPage;
  let fixture: ComponentFixture<OrdenDeVentaPage>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ OrdenDeVentaPage ],
      imports: [IonicModule.forRoot()]
    }).compileComponents();

    fixture = TestBed.createComponent(OrdenDeVentaPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  }));

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
