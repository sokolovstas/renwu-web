import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { FormsModule } from '@angular/forms';
import { provideLocationMocks } from '@angular/common/testing';
import { provideRouter } from '@angular/router';
import { NgxPopperModule } from 'ngx-popper';
import { OzModule } from 'oz';
import { CoreModule } from './core/core.module';
import { QueryBuilderComponent } from './query-builder.component';

describe('QueryBuilderComponent', () => {
  let component: QueryBuilderComponent;
  let fixture: ComponentFixture<QueryBuilderComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      imports: [OzModule, FormsModule, NgxPopperModule, CoreModule],
      declarations: [QueryBuilderComponent],
      providers: [provideRouter([]), provideLocationMocks()],
    }).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(QueryBuilderComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
