import { provideLocationMocks } from '@angular/common/testing';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { SelectGroupComponent } from './select-group.component';

describe('SelectGroupComponent', () => {
  it('compiles standalone module', async () => {
    await TestBed.configureTestingModule({
      imports: [SelectGroupComponent],
      providers: [provideRouter([]), provideLocationMocks()],
    }).compileComponents();
    expect(true).toBe(true);
  });
});
