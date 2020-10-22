import { async, ComponentFixture, TestBed } from '@angular/core/testing';
import { IonicModule } from '@ionic/angular';

import { SelectProductsPage } from './select-products.page';

describe('SelectProductsPage', () => {
  let component: SelectProductsPage;
  let fixture: ComponentFixture<SelectProductsPage>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ SelectProductsPage ],
      imports: [IonicModule.forRoot()]
    }).compileComponents();

    fixture = TestBed.createComponent(SelectProductsPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  }));

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
