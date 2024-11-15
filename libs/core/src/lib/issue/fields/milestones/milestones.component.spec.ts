import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { Component } from '@angular/core';
import { IssueMilestonesComponent } from './shared/issue-fields/milestones/milestones.component';

@Component({
  template: ` <issue-milestones
    [value]="value"
    [parentValue]="parentValue"
  ></issue-milestones>`,
})
class TestHostComponent {
  value: any[];
  parentValue: any[];
}

describe('IssueMilestonesComponent', () => {
  let testHost: TestHostComponent;
  let fixture: ComponentFixture<TestHostComponent>;

  const getText = () => {
    return fixture.debugElement.nativeElement.innerText.trim();
  };

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [IssueMilestonesComponent, TestHostComponent],
    }).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(TestHostComponent);
    testHost = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(testHost).toBeTruthy();
  });

  it('should display milestones names', () => {
    testHost.value = null;
    fixture.detectChanges();
    expect(getText()).toBe('');

    testHost.value = [];
    fixture.detectChanges();
    expect(getText()).toBe('');

    testHost.value = [{}, null];
    fixture.detectChanges();
    expect(getText()).toBe('');

    testHost.value = [{}, { title: 'm1' }, { title: 'm2' }];
    fixture.detectChanges();
    expect(getText()).toBe('m1, m2');

    testHost.value = null;
    testHost.parentValue = [{}, { title: 'mp1' }];
    fixture.detectChanges();
    expect(getText()).toBe('mp1');

    testHost.value = [{ title: 'm1' }, { title: 'm2' }];
    testHost.parentValue = [{}, { title: 'mp1' }];
    fixture.detectChanges();
    expect(getText()).toBe('mp1\nm1, m2');
  });
});
