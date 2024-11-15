import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';

import { NO_ERRORS_SCHEMA } from '@angular/core';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { ShortcutServiceStub } from 'projects/components/src/test/shortcut-service-stub';
import { ShortcutService } from '../../../../../utils/src/lib/shortcut/shortcut.service';
import { RwModalService } from '../modal.service';
import { ModalComponent } from './modal.component';

describe('ModalComponent', () => {
  let component: ModalComponent;
  let fixture: ComponentFixture<ModalComponent>;

  beforeEach(waitForAsync(() => {
    return TestBed.configureTestingModule({
      imports: [BrowserAnimationsModule],
      declarations: [ModalComponent],
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
          provide: ShortcutService,
          useClass: ShortcutServiceStub,
        },
      ],
      schemas: [NO_ERRORS_SCHEMA],
    }).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ModalComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
