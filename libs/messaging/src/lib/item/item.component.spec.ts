import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { NO_ERRORS_SCHEMA } from '@angular/core';
import { provideLocationMocks } from '@angular/common/testing';
import { provideRouter } from '@angular/router';
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
      imports: [CoreModule, OzModule, SharedModule],
      providers: [
        IssueService,
        MessageService,
        provideRouter([]),
        provideLocationMocks(),
      ],
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
