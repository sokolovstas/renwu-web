import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { NO_ERRORS_SCHEMA } from '@angular/core';
import { ListExporterComponent } from './container/list-exporter/list-exporter.component';

describe('ListExporterComponent', () => {
  let component: ListExporterComponent;
  let fixture: ComponentFixture<ListExporterComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ListExporterComponent],
      schemas: [NO_ERRORS_SCHEMA],
    }).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ListExporterComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
