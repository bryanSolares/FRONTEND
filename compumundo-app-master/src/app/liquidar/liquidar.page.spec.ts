import { async, ComponentFixture, TestBed } from '@angular/core/testing';
import { IonicModule } from '@ionic/angular';

import { LiquidarPage } from './liquidar.page';

describe('LiquidarPage', () => {
  let component: LiquidarPage;
  let fixture: ComponentFixture<LiquidarPage>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ LiquidarPage ],
      imports: [IonicModule.forRoot()]
    }).compileComponents();

    fixture = TestBed.createComponent(LiquidarPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  }));

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
