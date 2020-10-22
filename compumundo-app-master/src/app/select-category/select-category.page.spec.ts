import { async, ComponentFixture, TestBed } from '@angular/core/testing';
import { IonicModule } from '@ionic/angular';

import { SelectCategoryPage } from './select-category.page';

describe('SelectCategoryPage', () => {
  let component: SelectCategoryPage;
  let fixture: ComponentFixture<SelectCategoryPage>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ SelectCategoryPage ],
      imports: [IonicModule.forRoot()]
    }).compileComponents();

    fixture = TestBed.createComponent(SelectCategoryPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  }));

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
