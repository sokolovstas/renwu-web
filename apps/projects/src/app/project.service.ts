import { DestroyRef, Injectable, inject } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { TranslocoService } from '@ngneat/transloco';
import { RwAlertService, RwToastService } from '@renwu/components';
import {
  Container,
  Issue,
  Milestone,
  RwContainerService,
  RwDataService,
  Team,
  User,
} from '@renwu/core';
import { BehaviorSubject, map, of, switchMap, take, tap } from 'rxjs';

@Injectable()
export class ProjectService {
  destroy = inject(DestroyRef);
  transloco = inject(TranslocoService);
  currentProjectKey = new BehaviorSubject<string>('');
  currentProject = new BehaviorSubject<Container>(null);
  projects = this.containerService.containers;
  constructor(
    private dataService: RwDataService,
    private containerService: RwContainerService,
    private toastService: RwToastService,
    private alertService: RwAlertService,
  ) {
    this.currentProjectKey
      .pipe(
        switchMap((k) => this.containerService.getContainerByKey(k)),
        takeUntilDestroyed(this.destroy),
      )
      .subscribe(this.currentProject);
  }

  saveSettings(container: Container) {
    return this.currentProject.pipe(
      take(1),
      switchMap((p) =>
        this.dataService.saveContainer(p.id, {
          ...p,
          title: container.title ?? p.title,
          key: container.key ?? p.key,
          archived: container.archived ?? p.archived,
          settings: {
            ...p.settings,
            ...container.settings,
          },
        }),
      ),
      tap((c) => this.containerService.updateContainers([c])),
      tap(() =>
        this.toastService.success(
          this.transloco.translate('projects.settings-saved'),
        ),
      ),
    );
  }
  saveTemplate(issue: Issue) {
    return this.currentProject.pipe(
      take(1),
      switchMap((p) =>
        this.dataService.saveContainer(p.id, {
          ...p,
          settings: {
            ...p.settings,
            issue: issue,
          },
        }),
      ),
      tap((c) => this.containerService.updateContainers([c])),
      tap(() =>
        this.toastService.success(
          this.transloco.translate('projects.template-saved'),
        ),
      ),
    );
  }
  saveTeam(team: Team[]) {
    return this.currentProject.pipe(
      take(1),
      switchMap((p) =>
        this.dataService.saveContainer(p.id, {
          ...p,
          team,
        }),
      ),
      tap((c) => this.containerService.updateContainers([c])),
      tap(() =>
        this.toastService.success(
          this.transloco.translate('projects.team-saved'),
        ),
      ),
    );
  }
  addUserTo(
    user: User,
    collection: 'external' | 'internal' | 'managers' | 'admins',
  ) {
    return this.currentProject.pipe(
      take(1),
      switchMap((p) => {
        switch (collection) {
          case 'internal':
            if (p.team.findIndex((t) => t.user.id === user.id) === -1) {
              p.team.push({ user, worker: true });
            }
            break;
          case 'external':
            if (p.team.findIndex((t) => t.user.id === user.id) === -1) {
              p.team.push({ user });
            }
            break;
          case 'managers':
            if (p.managers.findIndex((t) => t.id === user.id) === -1) {
              p.managers.push(user);
            }
            break;
          case 'admins':
            if (p.admins.findIndex((t) => t.id === user.id) === -1) {
              p.admins.push(user);
            }
            break;
        }
        return this.dataService.saveContainer(p.id, {
          ...p,
        });
      }),
      tap((c) => this.containerService.updateContainers([c])),
      tap(() =>
        this.toastService.success(
          this.transloco.translate('projects.user-added-to-group'),
        ),
      ),
    );
  }
  addProject(project: Container) {
    return this.dataService.addContainer(project).pipe(
      tap((c) => this.containerService.updateContainers([c])),
      tap(() =>
        this.toastService.success(
          this.transloco.translate('projects.project-created'),
        ),
      ),
    );
  }
  removeProject(project: Container) {
    return this.alertService
      .confirm(
        this.transloco.translate('projects.are-you-sure?'),
        this.transloco.translate(
          'projects.do-you-want-to-delete-project-%title%-(%key%)',
          { title: project.title, key: project.key },
        ),
        true,
      )
      .pipe(
        switchMap((v) => {
          if (v.affirmative) {
            return this.dataService.deleteContainer(project.id).pipe(
              tap(() => this.containerService.removeContainer(project)),
              tap(() =>
                this.toastService.success(
                  this.transloco.translate('projects.project-deleted'),
                ),
              ),
            );
          }
          return of(null);
        }),
      );
  }
  removeUserFrom(
    user: User,
    collection: 'external' | 'internal' | 'managers' | 'admins',
  ) {
    return this.currentProject.pipe(
      take(1),
      switchMap((p) => {
        switch (collection) {
          case 'external':
          case 'internal':
            p.team = p.team.filter((u) => u.user.id !== user.id);
            break;
          case 'managers':
            p.managers = p.managers.filter((u) => u.id !== user.id);
            break;
          case 'admins':
            p.admins = p.admins.filter((u) => u.id !== user.id);
            break;
        }
        return this.dataService.saveContainer(p.id, {
          ...p,
        });
      }),
      tap((c) => this.containerService.updateContainers([c])),
      tap(() =>
        this.toastService.success(
          this.transloco.translate('projects.user-removed-from-group'),
        ),
      ),
    );
  }

  // milestones
  addMilestone(milestone: Milestone) {
    return this.dataService
      .addMilestone(milestone.container.id, milestone)
      .pipe(
        tap(() =>
          this.toastService.success(
            this.transloco.translate('projects.milestone-created'),
          ),
        ),
      );
  }
  saveMilestone(milestone: Milestone) {
    return this.dataService
      .saveMilestone(milestone.id, milestone)
      .pipe(
        tap(() =>
          this.toastService.success(
            this.transloco.translate('projects.milestone-updated'),
          ),
        ),
      );
  }
  archiveMilestone(milestone: Milestone) {
    return this.dataService.getMilestoneActiveList(milestone.id).pipe(
      switchMap((issues) => {
        if (issues.length > 0) {
          return this.alertService
            .confirm(
              this.transloco.translate(
                'projects.are-you-sure-you-want-to-archive-version "%title%"?',
                { title: milestone.title },
              ),
              this.transloco.translate(
                'projects.all-not-closed-issue-will-be-moved-to-unplanned.',
              ),
              true,
            )
            .pipe(map((button) => button.affirmative));
        }
        return of(true);
      }),
      switchMap((confirm) => {
        if (confirm) {
          return this.dataService.archiveMilestone(milestone.id);
        }
        return of(false);
      }),
    );
  }
  unarchiveMilestone(milestone: Milestone) {
    return this.alertService
      .confirm(
        this.transloco.translate(
          'projects.are-you-sure-you-want-to-unarchive-version "%title%"?',
          { title: milestone.title },
        ),
        '',
        true,
      )
      .pipe(
        switchMap((data) => {
          if (data && data.affirmative) {
            return this.dataService.unarchiveMilestone(milestone.id);
          }
          return of(false);
        }),
      );
  }
}
