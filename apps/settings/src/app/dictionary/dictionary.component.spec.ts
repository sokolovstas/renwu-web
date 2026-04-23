import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { TranslocoService } from '@jsverse/transloco';
import { RwToastService } from '@renwu/components';
import { RwDataService } from '@renwu/core';
import { of } from 'rxjs';
import { DictionaryComponent } from './dictionary.component';

describe('DictionaryComponent', () => {
  let fixture: ComponentFixture<DictionaryComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DictionaryComponent],
      providers: [
        provideRouter([]),
        {
          provide: RwDataService,
          useValue: {
            getDictionary: jest.fn().mockReturnValue(of([])),
            saveDictionary: jest.fn().mockReturnValue(of({})),
          },
        },
        { provide: RwToastService, useValue: { error: jest.fn() } },
        { provide: TranslocoService, useValue: { translate: (k: string) => k } },
      ],
    })
      .overrideComponent(DictionaryComponent, {
        set: { template: '', imports: [] },
      })
      .compileComponents();

    fixture = TestBed.createComponent(DictionaryComponent);
  });

  it('should create', () => {
    expect(fixture.componentInstance).toBeTruthy();
  });
});
