import { async, ComponentFixture, TestBed } from '@angular/core/testing';
import { IonicModule } from '@ionic/angular';

import { FacturaPorCobrarPage } from './factura-por-cobrar.page';

describe('FacturaPorCobrarPage', () => {
  let component: FacturaPorCobrarPage;
  let fixture: ComponentFixture<FacturaPorCobrarPage>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ FacturaPorCobrarPage ],
      imports: [IonicModule.forRoot()]
    }).compileComponents();

    fixture = TestBed.createComponent(FacturaPorCobrarPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  }));

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
