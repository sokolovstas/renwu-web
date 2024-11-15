import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { NO_ERRORS_SCHEMA } from '@angular/core';
import { RouterTestingModule } from '@angular/router/testing';
import { CoreModule } from './core/core.module';
import { SelectGroupComponent } from './shared/select-group/select-group.component';

describe('SelectGroupComponent', () => {
  let component: SelectGroupComponent;
  let fixture: ComponentFixture<SelectGroupComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      imports: [RwModule, CoreModule, RouterTestingModule],
      declarations: [SelectGroupComponent],
      providers: [],
      schemas: [NO_ERRORS_SCHEMA],
    }).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(SelectGroupComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
