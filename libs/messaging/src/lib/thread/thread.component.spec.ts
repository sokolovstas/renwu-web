import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MessageThreadComponent } from './thread.component';

describe('MessageThreadComponent', () => {
  let fixture: ComponentFixture<MessageThreadComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MessageThreadComponent],
    }).compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(MessageThreadComponent);
  });

  it('should create', () => {
    expect(fixture.componentInstance).toBeTruthy();
  });
});
