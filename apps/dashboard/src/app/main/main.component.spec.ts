import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { TranslocoService } from '@jsverse/transloco';
import { RwSidebarService } from '@renwu/app-ui';
import { of } from 'rxjs';
import { DashboardService } from '../dashboard.service';
import { MainComponent } from './main.component';

describe('MainComponent', () => {
  let component: MainComponent;
  let fixture: ComponentFixture<MainComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MainComponent],
      providers: [
        provideRouter([]),
        {
          provide: TranslocoService,
          useValue: {
            translate: (key: string) => key,
          },
        },
        {
          provide: DashboardService,
          useValue: {
            isOwner: () => true,
            activeId: {
              set(): void {
                return;
              },
            },
            get: () => of(null),
            ensureMine: () =>
              of({
                id: 'd1',
                title: 'My day',
                author_id: 'u1',
                widgets: [
                  {
                    id: 'default-my-work',
                    title: '',
                    titleKey: 'my-work',
                    source: 'query',
                    query: '',
                    cols: 2,
                    density: 'normal',
                    groupBy: 'schedule',
                  },
                ],
              }),
            save: (d: unknown) => of(d),
          },
        },
        {
          provide: RwSidebarService,
          useValue: {
            scrollToMain(): void {
              return;
            },
            currentTask: {
              next(): void {
                return;
              },
            },
          },
        },
      ],
    })
      .overrideComponent(MainComponent, {
        set: {
          template: '',
          imports: [],
          providers: [],
        },
      })
      .compileComponents();

    fixture = TestBed.createComponent(MainComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('loads my-work block for the personal dashboard', () => {
    expect(component.widgets()[0].id).toBe('default-my-work');
    expect(component.widgets()[0].groupBy).toBe('schedule');
  });
});
