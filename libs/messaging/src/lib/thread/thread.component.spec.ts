import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { NO_ERRORS_SCHEMA } from '@angular/core';
import { MessageThreadComponent } from './message/thread/thread.component';

describe('MessageThreadComponent', () => {
  let component: MessageThreadComponent;
  let fixture: ComponentFixture<MessageThreadComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [MessageThreadComponent],
      schemas: [NO_ERRORS_SCHEMA],
    }).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(MessageThreadComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
