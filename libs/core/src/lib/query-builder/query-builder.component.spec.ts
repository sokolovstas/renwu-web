import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { FormsModule } from '@angular/forms';
import { RouterTestingModule } from '@angular/router/testing';
import { NgxPopperModule } from 'ngx-popper';
import { OzModule } from 'oz';
import { CoreModule } from './core/core.module';
import { QueryBuilderComponent } from './query-builder.component';

describe('QueryBuilderComponent', () => {
  let component: QueryBuilderComponent;
  let fixture: ComponentFixture<QueryBuilderComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      imports: [
        OzModule,
        RouterTestingModule,
        FormsModule,
        NgxPopperModule,
        CoreModule,
      ],
      declarations: [QueryBuilderComponent],
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
