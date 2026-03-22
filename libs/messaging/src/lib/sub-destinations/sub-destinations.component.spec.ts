import { ComponentFixture, TestBed } from '@angular/core/testing';

import { MessageSubDestinationsComponent } from './sub-destinations.component';

describe('MessageSubDestinationsComponent', () => {
  let component: MessageSubDestinationsComponent;
  let fixture: ComponentFixture<MessageSubDestinationsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MessageSubDestinationsComponent],
    }).compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(MessageSubDestinationsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
