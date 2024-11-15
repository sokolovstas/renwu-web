import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';
import { BehaviorSubject } from 'rxjs';
import { User } from '../user/user.model';
import { RwUserService } from '../user/user.service';
import { AvatarComponent } from './avatar.component';

describe('AvatarComponent', () => {
  let component: AvatarComponent;
  let fixture: ComponentFixture<AvatarComponent>;

  beforeEach(waitForAsync(() => {
    return TestBed.configureTestingModule({
      imports: [AvatarComponent],
      declarations: [],
      providers: [
        {
          provide: RwUserService,
          useValue: {
            userList: new BehaviorSubject<User[]>([]),
            onlineMap: new BehaviorSubject<Map<string, boolean>>(new Map()),
          },
        },
      ],
    }).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(AvatarComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
