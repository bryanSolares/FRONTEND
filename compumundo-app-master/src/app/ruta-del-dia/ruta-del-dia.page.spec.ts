import { async, ComponentFixture, TestBed } from '@angular/core/testing';
import { IonicModule } from '@ionic/angular';

import { RutaDelDiaPage } from './ruta-del-dia.page';

describe('RutaDelDiaPage', () => {
  let component: RutaDelDiaPage;
  let fixture: ComponentFixture<RutaDelDiaPage>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ RutaDelDiaPage ],
      imports: [IonicModule.forRoot()]
    }).compileComponents();

    fixture = TestBed.createComponent(RutaDelDiaPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  }));

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
