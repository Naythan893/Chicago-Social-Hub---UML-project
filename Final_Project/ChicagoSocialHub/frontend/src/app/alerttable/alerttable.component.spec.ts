import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { AlerttableComponent } from './alerttable.component';

describe('AlerttableComponent', () => {
  let component: AlerttableComponent;
  let fixture: ComponentFixture<AlerttableComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ AlerttableComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(AlerttableComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
