import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { User } from '../user.model';
import { UserCardComponent } from './user-card.component';

describe('UserCardComponent', () => {
  let component: UserCardComponent;
  let fixture: ComponentFixture<UserCardComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [UserCardComponent],
      providers: [provideRouter([])],
    }).compileComponents();

    fixture = TestBed.createComponent(UserCardComponent);
    component = fixture.componentInstance;
    component.user = {
      id: '1',
      username: 'alice',
      full_name: 'Alice Example',
      email: 'alice@example.com',
    } as User;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('renders name and email', () => {
    const el: HTMLElement = fixture.nativeElement;
    expect(el.textContent).toContain('Alice Example');
    expect(el.textContent).toContain('alice@example.com');
  });
});
