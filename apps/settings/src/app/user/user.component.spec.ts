import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { TranslocoService } from '@jsverse/transloco';
import { RwToastService } from '@renwu/components';
import {
  CheckUserValidator,
  RW_CORE_SETTINGS,
  RwDataService,
  RwUserService,
  StateService,
} from '@renwu/core';
import { of } from 'rxjs';
import { UserComponent } from './user.component';

describe('UserComponent', () => {
  let fixture: ComponentFixture<UserComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [UserComponent],
      providers: [
        provideRouter([]),
        { provide: RW_CORE_SETTINGS, useValue: { siteBillingUrl: '' } },
        { provide: RwToastService, useValue: { error: jest.fn() } },
        { provide: StateService, useValue: {} },
        {
          provide: RwDataService,
          useValue: {
            getUser: jest.fn().mockReturnValue(
              of({
                id: '1',
                username: 'test',
                email: '',
                full_name: '',
              }),
            ),
          },
        },
        {
          provide: RwUserService,
          useValue: { saveUser: jest.fn().mockReturnValue(of({})) },
        },
        {
          provide: CheckUserValidator,
          useValue: { validate: () => Promise.resolve(null) },
        },
        { provide: TranslocoService, useValue: { translate: (k: string) => k } },
      ],
    })
      .overrideComponent(UserComponent, {
        set: { template: '', imports: [] },
      })
      .compileComponents();

    fixture = TestBed.createComponent(UserComponent);
  });

  it('should create', () => {
    expect(fixture.componentInstance).toBeTruthy();
  });
});
