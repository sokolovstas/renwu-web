import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { RwSidebarService } from '@renwu/app-ui';
import { RwMessageService } from '@renwu/messaging';
import { of } from 'rxjs';
import { MainComponent } from './main.component';

describe('MainComponent', () => {
  let fixture: ComponentFixture<MainComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MainComponent],
      providers: [
        provideRouter([]),
        {
          provide: RwMessageService,
          useValue: {
            getDestination: jest.fn().mockReturnValue(of(null)),
          },
        },
        { provide: RwSidebarService, useValue: { scrollToMain: jest.fn() } },
      ],
    })
      .overrideComponent(MainComponent, {
        set: { template: '', imports: [] },
      })
      .compileComponents();

    fixture = TestBed.createComponent(MainComponent);
  });

  it('should create', () => {
    expect(fixture.componentInstance).toBeTruthy();
  });
});
