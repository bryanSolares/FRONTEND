import { async, ComponentFixture, TestBed } from '@angular/core/testing';
import { IonicModule } from '@ionic/angular';

import { FacturaPorEntregarPage } from './factura-por-entregar.page';

describe('FacturaPorEntregarPage', () => {
  let component: FacturaPorEntregarPage;
  let fixture: ComponentFixture<FacturaPorEntregarPage>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ FacturaPorEntregarPage ],
      imports: [IonicModule.forRoot()]
    }).compileComponents();

    fixture = TestBed.createComponent(FacturaPorEntregarPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  }));

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
