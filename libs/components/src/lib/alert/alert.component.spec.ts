import { NO_ERRORS_SCHEMA } from '@angular/core';
import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';
import { ShortcutServiceStub } from '../../test/shortcut-service-stub';
import { RwShortcutService } from '../shortcut/shortcut.service';
import { RwAlertComponent } from './alert.component';
import { AlertInstance, RwAlertService } from './alert.service';

describe('RwAlertComponent', () => {
  let component: RwAlertComponent;
  let fixture: ComponentFixture<RwAlertComponent>;

  beforeEach(waitForAsync(() => {
    return TestBed.configureTestingModule({
      imports: [RwAlertComponent],
      providers: [
        {
          provide: RwAlertService,
          useClass: class {},
        },
        {
          provide: RwShortcutService,
          useClass: ShortcutServiceStub,
        },
      ],
      schemas: [NO_ERRORS_SCHEMA],
    }).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(RwAlertComponent);
    component = fixture.componentInstance;
    component.alert = {} as AlertInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
