import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { RealTimeComponentComponent } from './real-time-component.component';

describe('RealTimeComponentComponent', () => {
  let component: RealTimeComponentComponent;
  let fixture: ComponentFixture<RealTimeComponentComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ RealTimeComponentComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(RealTimeComponentComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
