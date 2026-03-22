import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';

import { NO_ERRORS_SCHEMA } from '@angular/core';
import { ShortcutServiceStub } from '../../../test/shortcut-service-stub';
import { RwShortcutService } from '../../shortcut/shortcut.service';
import { RwModalService } from '../modal.service';
import { RwModalComponent } from './modal.component';

describe('RwModalComponent', () => {
  let component: RwModalComponent;
  let fixture: ComponentFixture<RwModalComponent>;

  beforeEach(waitForAsync(() => {
    return TestBed.configureTestingModule({
      imports: [RwModalComponent],
      providers: [
        {
          provide: RwModalService,
          useClass: class {
            registerModal = () => {
              return;
            };
            close = () => {
              return;
            };
          },
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
    fixture = TestBed.createComponent(RwModalComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
