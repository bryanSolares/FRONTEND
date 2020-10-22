import { async, ComponentFixture, TestBed } from '@angular/core/testing';
import { IonicModule } from '@ionic/angular';

import { RutaDelRutPage } from './ruta-del-rut.page';

describe('RutaDelRutPage', () => {
  let component: RutaDelRutPage;
  let fixture: ComponentFixture<RutaDelRutPage>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [RutaDelRutPage],
      imports: [IonicModule.forRoot()]
    }).compileComponents();

    fixture = TestBed.createComponent(RutaDelRutPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  }));

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
