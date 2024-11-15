import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { NO_ERRORS_SCHEMA } from '@angular/core';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { MessageSubDestinationsComponent } from './message/messages/sub-destinations/sub-destinations.component';
import { MessageService } from './message/service/message.service';

describe('MessageSubDestinationsComponent', () => {
  let component: MessageSubDestinationsComponent;
  let fixture: ComponentFixture<MessageSubDestinationsComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      imports: [NoopAnimationsModule],
      declarations: [MessageSubDestinationsComponent],
      providers: [MessageService],
      schemas: [NO_ERRORS_SCHEMA],
    }).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(MessageSubDestinationsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
