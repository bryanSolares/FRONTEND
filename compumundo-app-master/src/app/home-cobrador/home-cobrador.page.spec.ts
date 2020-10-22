import { async, ComponentFixture, TestBed } from '@angular/core/testing';
import { IonicModule } from '@ionic/angular';

import { HomeCobradorPage } from './home-cobrador.page';

describe('HomeCobradorPage', () => {
  let component: HomeCobradorPage;
  let fixture: ComponentFixture<HomeCobradorPage>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ HomeCobradorPage ],
      imports: [IonicModule.forRoot()]
    }).compileComponents();

    fixture = TestBed.createComponent(HomeCobradorPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  }));

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
