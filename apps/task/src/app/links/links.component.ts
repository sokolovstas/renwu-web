import { AsyncPipe } from '@angular/common';
import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  inject,
} from '@angular/core';
import { TranslocoPipe, TranslocoService } from '@jsverse/transloco';
import {
  RwAlertService,
  RwButtonComponent,
  RwToastService,
} from '@renwu/components';
import {
  Issue,
  IssueHrefComponent,
  IssueLink,
  IssueLinks,
  IssueStatusComponent,
  RwIssueService,
  RwPolicyService,
} from '@renwu/core';
import {
  Observable,
  distinctUntilChanged,
  firstValueFrom,
  map,
  merge,
  startWith,
  switchMap,
} from 'rxjs';

import { IssueLinkSearchInputComponent } from '../issue-links/issue-link-search-input.component';
import {
  collectLinkedIssueKeys,
  issueToIssueLink,
  isIssueKeyInAnyLinkBucket,
} from '../issue-links/issue-links.util';

export type TaskStructuralLinkKind = 'parent' | 'prev_issue' | 'next_issue';

@Component({
  selector: 'renwu-task-links',
  standalone: true,
  imports: [
    AsyncPipe,
    RwButtonComponent,
    IssueLinkSearchInputComponent,
    TranslocoPipe,
    IssueHrefComponent,
    IssueStatusComponent,
  ],
  templateUrl: './links.component.html',
  styleUrl: './links.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LinksComponent {
  issueService = inject(RwIssueService);
  toastService = inject(RwToastService);
  transloco = inject(TranslocoService);
  cd = inject(ChangeDetectorRef);
  alertService = inject(RwAlertService);
  policyService = inject(RwPolicyService);

  isNewIssue = this.issueService.newIssue;

  private readonly linksRefresh$ = merge(
    this.issueService.issue,
    this.issueService.issueForm.controls.links.valueChanges,
  );

  private readonly sliceLinks = (
    kind: TaskStructuralLinkKind,
  ): Observable<IssueLink[]> =>
    this.linksRefresh$.pipe(
      map(
        () =>
          (this.issueService.issueForm.getRawValue().links?.[kind] ??
            []) as IssueLink[],
      ),
      startWith([] as IssueLink[]),
    );

  readonly blocks: ReadonlyArray<{
    kind: TaskStructuralLinkKind;
    titleKey: string;
    links$: Observable<IssueLink[]>;
  }> = [
    {
      kind: 'parent',
      titleKey: 'task.links-parent',
      links$: this.sliceLinks('parent'),
    },
    {
      kind: 'prev_issue',
      titleKey: 'task.links-prev',
      links$: this.sliceLinks('prev_issue'),
    },
    {
      kind: 'next_issue',
      titleKey: 'task.links-next',
      links$: this.sliceLinks('next_issue'),
    },
  ];

  linkedKeys$ = merge(
    this.issueService.issue,
    this.issueService.issueForm.controls.links.valueChanges,
  ).pipe(
    map(() =>
      collectLinkedIssueKeys(this.issueService.issueForm.getRawValue().links),
    ),
    startWith([] as string[]),
  );

  canEdit$ = merge(
    this.issueService.issue,
    this.issueService.issueForm.valueChanges.pipe(
      startWith(this.issueService.issueForm.value),
    ),
  ).pipe(
    map(() => {
      const v = this.issueService.issueForm.getRawValue();
      const id = !v.id || v.id === 'new' ? 'new' : String(v.id);
      const cid = v.container?.id ? String(v.container.id) : '';
      return { id, cid };
    }),
    distinctUntilChanged(
      (a, b) => a.id === b.id && a.cid === b.cid,
    ),
    switchMap(({ id, cid }) => this.policyService.canEditIssue(id, cid)),
  );

  async addIssue(kind: TaskStructuralLinkKind, issue: Issue): Promise<void> {
    const key = (issue.key ?? '').trim();
    if (!key) {
      return;
    }
    const current = this.issueService.issueForm.getRawValue();
    if (current.id === 'new' || !current.id) {
      this.toastService.info(
        this.transloco.translate('task.links-save-first'),
      );
      return;
    }
    const canEdit = await firstValueFrom(
      this.policyService.canEditIssue(
        String(current.id),
        current.container?.id ? String(current.container.id) : '',
      ),
    );
    if (!canEdit) {
      return;
    }
    if (isIssueKeyInAnyLinkBucket(key, current.links)) {
      this.toastService.info(this.transloco.translate('task.links-duplicate'));
      return;
    }
    if ((current.key ?? '').trim() === key) {
      this.toastService.info(this.transloco.translate('task.links-self'));
      return;
    }
    const link = issueToIssueLink(issue);
    const links = this.issueService.issueForm.getRawValue().links;
    const prevArr = (links?.[kind] ?? []) as IssueLink[];
    const next: IssueLinks = {
      ...links,
      [kind]: [...prevArr, link],
    };
    this.issueService.issueForm.controls.links.setValue(next);
    this.cd.markForCheck();
  }

  async remove(kind: TaskStructuralLinkKind, link: IssueLink): Promise<void> {
    const raw = this.issueService.issueForm.getRawValue();
    if (raw.id === 'new' || !raw.id) {
      return;
    }
    const canEdit = await firstValueFrom(
      this.policyService.canEditIssue(
        String(raw.id),
        raw.container?.id ? String(raw.container.id) : '',
      ),
    );
    if (!canEdit) {
      return;
    }
    const links = raw.links;
    const arr = links?.[kind] ?? [];
    if (!arr.length) {
      return;
    }
    const result = await firstValueFrom(
      this.alertService.confirm(
        this.transloco.translate('task.links-unlink-title'),
        this.transloco.translate('task.links-unlink-message', {
          key: link.key || link.title || '',
        }),
        true,
        this.transloco.translate('core.delete'),
        this.transloco.translate('core.cancel'),
      ),
    );
    if (!result?.affirmative) {
      return;
    }
    const next: IssueLinks = {
      ...links,
      [kind]: arr.filter((r) => r.key !== link.key),
    };
    this.issueService.issueForm.controls.links.setValue(next);
    this.cd.markForCheck();
  }
}
