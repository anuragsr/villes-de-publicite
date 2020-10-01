import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CarouselParentComponent } from './carousel-parent.component';

describe('CarouselParentComponent', () => {
  let component: CarouselParentComponent;
  let fixture: ComponentFixture<CarouselParentComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ CarouselParentComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(CarouselParentComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
