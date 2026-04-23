import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { RwModalService } from '@renwu/components';
import { RwUserService } from '@renwu/core';
import { of } from 'rxjs';
import { UsersComponent } from './users.component';

describe('UsersComponent', () => {
  let fixture: ComponentFixture<UsersComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [UsersComponent],
      providers: [
        provideRouter([]),
        {
          provide: RwUserService,
          useValue: {
            userList: of([]),
            onlineMap: of(new Map()),
          },
        },
        { provide: RwModalService, useValue: { add: jest.fn() } },
      ],
    })
      .overrideComponent(UsersComponent, {
        set: { template: '', imports: [] },
      })
      .compileComponents();

    fixture = TestBed.createComponent(UsersComponent);
  });

  it('should create', () => {
    expect(fixture.componentInstance).toBeTruthy();
  });
});
