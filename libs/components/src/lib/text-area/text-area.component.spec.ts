import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideLocationMocks } from '@angular/common/testing';
import { provideRouter } from '@angular/router';
import { RwTextAreaComponent } from './text-area.component';

describe('RwTextAreaComponent', () => {
  let fixture: ComponentFixture<RwTextAreaComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [RwTextAreaComponent],
      providers: [provideRouter([]), provideLocationMocks()],
    }).compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(RwTextAreaComponent);
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(fixture.componentInstance).toBeTruthy();
  });

  it('should round-trip markdown through the editor', () => {
    const md = '**bold** and *italic*\n\n- item';
    fixture.componentInstance.writeValue(md);
    fixture.detectChanges();
    const value = fixture.componentInstance.value;
    expect(value).toContain('**bold**');
    expect(value).toContain('*italic*');
    expect(value).toMatch(/[-*] item/);
  });

  it('should render markdown written after the editor is created', () => {
    fixture.componentInstance.writeValue('## Goal\n\nVisible description');
    fixture.detectChanges();
    const text = fixture.nativeElement.textContent as string;
    expect(text).toContain('Goal');
    expect(text).toContain('Visible description');
  });

  it('should render markdown written before the editor is created', () => {
    const early = TestBed.createComponent(RwTextAreaComponent);
    early.componentInstance.writeValue('## Goal\n\nBefore init');
    early.detectChanges();
    const text = early.nativeElement.textContent as string;
    expect(text).toContain('Goal');
    expect(text).toContain('Before init');
  });

  it('should paint markdown after the host leaves a hidden tab', () => {
    const Original = window.IntersectionObserver;
    let notify: IntersectionObserverCallback = () => undefined;
    class ImmediateObserver {
      constructor(cb: IntersectionObserverCallback) {
        notify = cb;
      }
      observe(): void {
        return;
      }
      unobserve(): void {
        return;
      }
      disconnect(): void {
        return;
      }
      takeRecords(): IntersectionObserverEntry[] {
        return [];
      }
    }
    window.IntersectionObserver =
      ImmediateObserver as unknown as typeof IntersectionObserver;

    const hidden = document.createElement('div');
    hidden.hidden = true;
    document.body.appendChild(hidden);

    const late = TestBed.createComponent(RwTextAreaComponent);
    hidden.appendChild(late.nativeElement);
    late.detectChanges();
    late.componentInstance.writeValue('## Goal\n\nHidden then shown');
    expect(late.nativeElement.textContent as string).not.toContain(
      'Hidden then shown',
    );

    hidden.hidden = false;
    notify(
      [{ isIntersecting: true } as IntersectionObserverEntry],
      {} as IntersectionObserver,
    );
    expect(late.nativeElement.textContent as string).toContain(
      'Hidden then shown',
    );

    late.destroy();
    hidden.remove();
    window.IntersectionObserver = Original;
  });

  it('should enable markdown toolbar plugins by default', () => {
    const plugins = fixture.componentInstance.editor.state.plugins;
    expect(plugins.length).toBeGreaterThan(3);
    expect(
      fixture.nativeElement.querySelector('.ProseMirror-menubar'),
    ).toBeTruthy();
  });
});
