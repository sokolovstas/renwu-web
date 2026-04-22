import { provideLocationMocks } from '@angular/common/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { RwUserService } from '@renwu/core';
import { RwMessageService } from '../message.service';
import { DestinationComponent } from './destination.component';

describe('DestinationComponent', () => {
  let fixture: ComponentFixture<DestinationComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DestinationComponent],
      providers: [
        provideRouter([]),
        provideLocationMocks(),
        { provide: RwMessageService, useValue: {} },
        { provide: RwUserService, useValue: {} },
      ],
    }).compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(DestinationComponent);
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(fixture.componentInstance).toBeTruthy();
  });
});
