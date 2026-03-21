import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { NO_ERRORS_SCHEMA } from '@angular/core';
import { provideLocationMocks } from '@angular/common/testing';
import { provideRouter } from '@angular/router';
import { OzModule } from 'oz';
import { CoreModule } from './core/core.module';
import { IssueService } from './issue/issue.service';
import { MessageInputComponent } from './message/input/input.component';
import { MessageService } from './message/service/message.service';
import { SharedModule } from './shared/shared.module';

describe('MessageInputComponent', () => {
  let component: MessageInputComponent;
  let fixture: ComponentFixture<MessageInputComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      imports: [CoreModule, OzModule, SharedModule],
      providers: [
        IssueService,
        MessageService,
        provideRouter([]),
        provideLocationMocks(),
      ],
      declarations: [MessageInputComponent],
      schemas: [NO_ERRORS_SCHEMA],
    }).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(MessageInputComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
