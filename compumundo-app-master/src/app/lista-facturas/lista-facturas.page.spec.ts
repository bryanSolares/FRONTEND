import { async, ComponentFixture, TestBed } from '@angular/core/testing';
import { IonicModule } from '@ionic/angular';

import { ListaFacturasPage } from './lista-facturas.page';

describe('ListaFacturasPage', () => {
  let component: ListaFacturasPage;
  let fixture: ComponentFixture<ListaFacturasPage>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ ListaFacturasPage ],
      imports: [IonicModule.forRoot()]
    }).compileComponents();

    fixture = TestBed.createComponent(ListaFacturasPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  }));

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
