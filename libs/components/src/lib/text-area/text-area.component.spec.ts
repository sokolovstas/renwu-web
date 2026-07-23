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

  it('should enable markdown toolbar plugins by default', () => {
    const plugins = fixture.componentInstance.editor.state.plugins;
    expect(plugins.length).toBeGreaterThan(3);
    expect(
      fixture.nativeElement.querySelector('.ProseMirror-menubar'),
    ).toBeTruthy();
  });
});
