import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ListExporterComponent } from './list-exporter.component';

describe('ListExporterComponent', () => {
  let fixture: ComponentFixture<ListExporterComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ListExporterComponent],
    }).compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(ListExporterComponent);
  });

  it('should create', () => {
    expect(fixture.componentInstance).toBeTruthy();
  });
});
