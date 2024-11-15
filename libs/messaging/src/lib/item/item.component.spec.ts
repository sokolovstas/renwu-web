import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { NO_ERRORS_SCHEMA } from '@angular/core';
import { RouterTestingModule } from '@angular/router/testing';
import { OzModule } from 'oz';
import { CoreModule } from './core/core.module';
import { IssueService } from './issue/issue.service';
import { MessageItemComponent } from './message/item/item.component';
import { MessageService } from './message/service/message.service';
import { SharedModule } from './shared/shared.module';

describe('MessageItemComponent', () => {
  let component: MessageItemComponent;
  let fixture: ComponentFixture<MessageItemComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      imports: [CoreModule, OzModule, SharedModule, RouterTestingModule],
      providers: [IssueService, MessageService],
      declarations: [MessageItemComponent],
      schemas: [NO_ERRORS_SCHEMA],
    }).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(MessageItemComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
