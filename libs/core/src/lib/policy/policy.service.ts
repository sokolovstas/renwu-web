import { Injectable } from '@angular/core';
import { RwSelectComponent, RwToastService } from '@renwu/components';
import { JSONUtils } from '@renwu/utils';
import { forkJoin, Observable, of, Subject } from 'rxjs';
import { Md5 } from 'ts-md5';
import { RwDataService } from '../data/data.service';
import { Issue } from '../issue/issue.model';
import { RwUserService } from '../user/user.service';

export const ObjectTypeTenant = 'tenant';
export const ObjectTypeTenantSettings = 'tenant_settings';
export const ObjectTypeContainer = 'container';
export const ObjectTypeContainerSettings = 'container_settings';
export const ObjectTypePriorityBoard = 'priority_board';
export const ObjectTypeUser = 'user';
export const ObjectTypeIssue = 'issue';
export const ObjectTypeMilestone = 'milestone';
export const ObjectTypePrivateMessage = 'private_messaging';
export const ObjectTypeProjectOverview = 'project_overview';
export const ObjectTypeIssueSortInMilestone = 'issue_sort_milestone';
export const ObjectTypeIssueSortUnplanned = 'issue_sort_unplanned';

const ObjectTypeIssueFieldContainer = 'issue_container';
const ObjectTypeIssueFieldMilestones = 'issue_milestones';
// FIXME: Проверить почему нету проверки
// const ObjectTypeIssueFieldAffectedVersions = 'issue_affected_versions';
const ObjectTypeIssueFieldSkill = 'issue_skill';
const ObjectTypeIssueFieldAssignes = 'issue_assignes';
const ObjectTypeIssueFieldWatchers = 'issue_watchers';
const ObjectTypeIssueFieldReporter = 'issue_reporter';
const ObjectTypeIssueFieldAutoScheduling = 'issue_auto_scheduling';
const ObjectTypeIssueFieldEstimatedTime = 'issue_estimated_time';
const ObjectTypeIssueFieldCompletion = 'issue_completion';
const ObjectTypeIssueFieldTimeLogs = 'issue_time_logs';
const ObjectTypeIssueFieldDateStart = 'issue_date_start';
const ObjectTypeIssueFieldDateEnd = 'issue_date_end';
// const ObjectTypeIssueFields = [ObjectTypeIssueFieldContainer, ObjectTypeIssueFieldMilestones, ObjectTypeIssueFieldSkill, ObjectTypeIssueFieldAssignes,
//   ObjectTypeIssueFieldWatchers, ObjectTypeIssueFieldReporter, ObjectTypeIssueFieldAutoScheduling, ObjectTypeIssueFieldEstimatedTime,
//   ObjectTypeIssueFieldCompletion, ObjectTypeIssueFieldTimeLogs, ObjectTypeIssueFieldDateStart, ObjectTypeIssueFieldDateEnd, ObjectTypeIssueFieldAffectedVersions];

export const ActionView = 'view';
export const ActionCreate = 'create';
export const ActionEdit = 'edit';
export const ActionTransit = 'transit';
// const ArrayAction = [ActionView, ActionEdit];

const AccessDenied = 1;
const AccessLimited = 2;
const AccessAllowed = 3;

export type AccessLevel =
  | typeof AccessDenied
  | typeof AccessLimited
  | typeof AccessAllowed;

export interface PolicyAnswer extends PolicyAsk {
  access: AccessLevel;
  message: string;
}

export interface PolicyAsk {
  objectID: string;
  context?: Record<string, string>;
  action:
    | typeof ActionView
    | typeof ActionCreate
    | typeof ActionEdit
    | typeof ActionTransit;
  objectType:
    | typeof ObjectTypeTenant
    | typeof ObjectTypeTenantSettings
    | typeof ObjectTypeContainer
    | typeof ObjectTypeContainerSettings
    | typeof ObjectTypePriorityBoard
    | typeof ObjectTypeUser
    | typeof ObjectTypeIssue
    | typeof ObjectTypeMilestone
    | typeof ObjectTypePrivateMessage
    | typeof ObjectTypeProjectOverview
    | typeof ObjectTypeIssueSortInMilestone
    | typeof ObjectTypeIssueSortUnplanned
    | typeof ObjectTypeIssueFieldContainer
    | typeof ObjectTypeIssueFieldMilestones
    // | typeof ObjectTypeIssueFieldAffectedVersions
    | typeof ObjectTypeIssueFieldSkill
    | typeof ObjectTypeIssueFieldAssignes
    | typeof ObjectTypeIssueFieldWatchers
    | typeof ObjectTypeIssueFieldReporter
    | typeof ObjectTypeIssueFieldAutoScheduling
    | typeof ObjectTypeIssueFieldEstimatedTime
    | typeof ObjectTypeIssueFieldCompletion
    | typeof ObjectTypeIssueFieldTimeLogs
    | typeof ObjectTypeIssueFieldDateStart
    | typeof ObjectTypeIssueFieldDateEnd;
}

export interface AccessCheckList {
  acl: PolicyAnswer[];
}

@Injectable({
  providedIn: 'root',
})
export class RwPolicyService {
  mapPolicyJSON: { [x: string]: AccessLevel } & { id?: string };
  mapPolicySubjects: Map<string, Subject<boolean>>;
  teamName: string;

  fetchTimeout = -1;
  observerMap: {
    [key: string]: { s: Subject<boolean>; p: Partial<PolicyAsk> };
  };

  constructor(
    private userService: RwUserService,
    private dataService: RwDataService,
    private toastService: RwToastService,
  ) {
    this.mapPolicySubjects = new Map();

    this.observerMap = {};
    this.mapPolicyJSON = {};
  }
  init(): Observable<boolean> {
    this.mapPolicyJSON = JSONUtils.parseLocalStorage(
      `renwu_policy_v3_${this.userService.getId()}`,
      {},
    );

    const currentPolicyID = Md5.hashStr(
      `${this.userService.getIsAdmin().toString()}${
        this.userService.getUser().type
      }${this.userService.getUser().is_admin.toString()}`,
    );

    if (this.mapPolicyJSON?.id?.toString() !== currentPolicyID) {
      this.mapPolicyJSON = {};
    }
    this.mapPolicyJSON.id = currentPolicyID;

    // Prefetch some policies
    const prefetch = [this.canEditTenantSettings()];
    forkJoin(prefetch).subscribe();

    return of(true);
  }
  // sendToAPI<T>(
  //   method: string,
  //   url: string,
  //   data: any = null,
  //   background = false,
  // ): Observable<T> {
  //   const options = {
  //     headers: new HttpHeaders({
  //       'Content-Type': 'application/json',
  //     }),
  //     withCredentials: true,
  //   };

  //   return this.http.post<T>(environment.rootApiUrl + url, data, options);
  // }
  checkPolicy(
    policy: Array<Partial<PolicyAsk>>,
    background = true,
  ): Observable<AccessCheckList> {
    return this.dataService.sendToAPI<AccessCheckList>(
      'post',
      `/accesscontrol/checkpolicies/`,
      { actions: policy },
      background,
    );
  }
  // checkPolicySet(policy: any, background = true): Observable<AccessCheckList> {
  //   return this.dataService.sendToAPI<AccessCheckList>(
  //     'post',
  //     `/accesscontrol/checkpolicyset/`,
  //     policy,
  //     background,
  //   );
  // }
  checkPolicyIssue(issue: Issue, background = true) {
    this.dataService
      .sendToAPI<AccessCheckList>(
        'post',
        `/accesscontrol/checkissue/`,
        issue,
        background,
      )
      .subscribe((data) => {
        this.parseAcl(
          data.acl,
          this.getCreateIssuePolicyId(issue.container.id),
        );
      });
  }
  getAccess(answer: AccessLevel): boolean {
    if (answer && answer === AccessAllowed) {
      return true;
    }
    return false;
  }

  canCreateMilestone(container_id: string): Observable<boolean> {
    return this.getSubject({
      action: ActionCreate,
      objectType: ObjectTypeMilestone,
      context: { 'context.container_id': container_id },
    });
  }
  canCreateContainer(): Observable<boolean> {
    return this.getSubject({
      action: ActionCreate,
      objectType: ObjectTypeContainer,
    });
  }
  canCreateUser(): Observable<boolean> {
    return this.getSubject({
      action: ActionCreate,
      objectType: ObjectTypeUser,
    });
  }
  canSortUnplannedInMilestone(container_id: string): Observable<boolean> {
    return this.getSubject({
      objectType: ObjectTypeIssueSortUnplanned,
      context: { 'context.container_id': container_id },
    });
  }
  canSortInMilestone(container_id: string): Observable<boolean> {
    return this.getSubject({
      objectType: ObjectTypeIssueSortInMilestone,
      context: { 'context.container_id': container_id },
    });
  }
  canViewProjectOverview(id: string): Observable<boolean> {
    return this.getSubject({
      objectID: id,
      action: ActionView,
      objectType: ObjectTypeProjectOverview,
    });
  }
  canViewIssue(id: string): Observable<boolean> {
    return this.getSubject({
      objectID: id,
      action: ActionView,
      objectType: ObjectTypeIssue,
    });
  }
  canViewContainer(id: string): Observable<boolean> {
    return this.getSubject({
      objectID: id,
      action: ActionView,
      objectType: ObjectTypeContainer,
    });
  }
  canEditTenantSettings(): Observable<boolean> {
    return this.getSubject({
      action: ActionEdit,
      objectType: ObjectTypeTenantSettings,
    });
  }
  canEditUser(id: string): Observable<boolean> {
    return this.getSubject({
      objectID: id,
      action: ActionEdit,
      objectType: ObjectTypeUser,
    });
  }
  canEditMilestone(id: string): Observable<boolean> {
    return this.getSubject({
      objectID: id,
      action: ActionEdit,
      objectType: ObjectTypeMilestone,
    });
  }
  // FIELDS
  // id: issue or container id
  canEditFieldContainer(id: string, containerId = ''): Observable<boolean> {
    const policy: PolicyAsk = {
      objectID: id,
      action: ActionEdit,
      objectType: ObjectTypeIssueFieldContainer,
    };
    if (id === 'new') {
      policy.objectID = this.getCreateIssuePolicyId(containerId);
      return this.featureSubject(policy);
    }
    return this.getSubject(policy);
  }
  canEditFieldAffectedVersion(
    id: string,
    containerId = '',
  ): Observable<boolean> {
    const policy: PolicyAsk = {
      objectID: id,
      action: ActionEdit,
      objectType: ObjectTypeIssueFieldMilestones,
    };
    if (id === 'new') {
      policy.objectID = this.getCreateIssuePolicyId(containerId);
      return this.featureSubject(policy);
    }
    return this.getSubject(policy);
  }
  canEditFieldSkill(id: string, containerId = ''): Observable<boolean> {
    const policy: PolicyAsk = {
      objectID: id,
      action: ActionEdit,
      objectType: ObjectTypeIssueFieldSkill,
    };
    if (id === 'new') {
      policy.objectID = this.getCreateIssuePolicyId(containerId);
      return this.featureSubject(policy);
    }
    return this.getSubject(policy);
  }
  canEditFieldWatchers(id: string, containerId = ''): Observable<boolean> {
    const policy: PolicyAsk = {
      objectID: id,
      action: ActionEdit,
      objectType: ObjectTypeIssueFieldWatchers,
    };
    if (id === 'new') {
      policy.objectID = this.getCreateIssuePolicyId(containerId);
      return this.featureSubject(policy);
    }
    return this.getSubject(policy);
  }
  canEditFieldReporter(id: string, containerId = ''): Observable<boolean> {
    const policy: PolicyAsk = {
      objectID: id,
      action: ActionEdit,
      objectType: ObjectTypeIssueFieldReporter,
    };
    if (id === 'new') {
      policy.objectID = this.getCreateIssuePolicyId(containerId);
      return this.featureSubject(policy);
    }
    return this.getSubject(policy);
  }
  canEditFieldAutoScheduling(
    id: string,
    containerId = '',
  ): Observable<boolean> {
    const policy: PolicyAsk = {
      objectID: id,
      action: ActionEdit,
      objectType: ObjectTypeIssueFieldAutoScheduling,
    };
    if (id === 'new') {
      policy.objectID = this.getCreateIssuePolicyId(containerId);
      return this.featureSubject(policy);
    }
    return this.getSubject(policy);
  }
  canEditFieldEstimatedTime(id: string, containerId = ''): Observable<boolean> {
    const policy: PolicyAsk = {
      objectID: id,
      action: ActionEdit,
      objectType: ObjectTypeIssueFieldEstimatedTime,
    };
    if (id === 'new') {
      policy.objectID = this.getCreateIssuePolicyId(containerId);
      return this.featureSubject(policy);
    }
    return this.getSubject(policy);
  }
  canEditFieldCompletion(id: string, containerId = ''): Observable<boolean> {
    const policy: PolicyAsk = {
      objectID: id,
      action: ActionEdit,
      objectType: ObjectTypeIssueFieldCompletion,
    };
    if (id === 'new') {
      policy.objectID = this.getCreateIssuePolicyId(containerId);
      return this.featureSubject(policy);
    }
    return this.getSubject(policy);
  }
  canEditFieldTimeLogs(id: string, containerId = ''): Observable<boolean> {
    const policy: PolicyAsk = {
      objectID: id,
      action: ActionEdit,
      objectType: ObjectTypeIssueFieldTimeLogs,
    };
    if (id === 'new') {
      policy.objectID = this.getCreateIssuePolicyId(containerId);
      return this.featureSubject(policy);
    }
    return this.getSubject(policy);
  }
  canEditFieldDateStart(id: string, containerId = ''): Observable<boolean> {
    const policy: PolicyAsk = {
      objectID: id,
      action: ActionEdit,
      objectType: ObjectTypeIssueFieldDateStart,
    };
    if (id === 'new') {
      policy.objectID = this.getCreateIssuePolicyId(containerId);
      return this.featureSubject(policy);
    }
    return this.getSubject(policy);
  }
  canEditFieldDateEnd(id: string, containerId = ''): Observable<boolean> {
    const policy: PolicyAsk = {
      objectID: id,
      action: ActionEdit,
      objectType: ObjectTypeIssueFieldDateEnd,
    };
    if (id === 'new') {
      policy.objectID = this.getCreateIssuePolicyId(containerId);
      return this.featureSubject(policy);
    }
    return this.getSubject(policy);
  }
  canEditFieldMilestones(id: string, containerId = ''): Observable<boolean> {
    const policy: PolicyAsk = {
      objectID: id,
      action: ActionEdit,
      objectType: ObjectTypeIssueFieldMilestones,
    };
    if (id === 'new') {
      policy.objectID = this.getCreateIssuePolicyId(containerId);
      return this.featureSubject(policy);
    }
    return this.getSubject(policy);
  }
  canEditFieldAssignes(id: string, containerId = ''): Observable<boolean> {
    const policy: PolicyAsk = {
      objectID: id,
      action: ActionEdit,
      objectType: ObjectTypeIssueFieldAssignes,
    };
    if (id === 'new') {
      policy.objectID = this.getCreateIssuePolicyId(containerId);
      return this.featureSubject(policy);
    }
    return this.getSubject(policy);
  }
  // ISSUE
  canEditIssue(id: string, containerId = ''): Observable<boolean> {
    if (id === 'new') {
      return this.canViewContainer(containerId);
    }
    return this.getSubject({
      objectID: id,
      action: ActionEdit,
      objectType: ObjectTypeIssue,
    });
  }
  canTransitIssue(id: string): Observable<boolean> {
    if (id === 'new') {
      return of(false);
    }
    return this.getSubject({
      objectID: id,
      action: ActionTransit,
      objectType: ObjectTypeIssue,
    });
  }
  canEditContainer(id: string): Observable<boolean> {
    return this.getSubject({
      objectID: id,
      action: ActionEdit,
      objectType: ObjectTypeContainer,
    });
  }
  canCreatePrivateMessage(): Observable<boolean> {
    return this.getSubject({ objectType: ObjectTypePrivateMessage });
  }
  savePolicyByKey(key: string, access: AccessLevel) {
    this.mapPolicyJSON[key] = access;
    JSONUtils.setLocalStorage(
      `renwu_policy_v3_${this.userService.getId()}`,
      this.mapPolicyJSON,
    );
  }
  getCreateIssuePolicyId(containerId: string): string {
    return containerId + '.new_issue';
  }
  getKeyByPolicy(policy: Partial<PolicyAsk>): string {
    const key = [];
    let context_id: string;
    for (const key in policy.context) {
      if (policy.context?.[key] && key.indexOf('container_id') > -1) {
        context_id = policy.context[key];
        break;
      }
    }
    if (context_id) {
      key.push(context_id);
    }
    if (policy.objectID) {
      key.push(policy.objectID);
    }
    if (policy.objectType) {
      key.push(policy.objectType);
    }
    if (policy.action) {
      key.push(policy.action);
    }
    return key.join('.');
  }
  getSubject(policy: Partial<PolicyAsk>): Observable<boolean> {
    const key = this.getKeyByPolicy(policy);
    if (this.mapPolicyJSON[key]) {
      return of(this.getAccess(this.mapPolicyJSON[key]));
    }
    if (this.mapPolicySubjects.has(key)) {
      return this.mapPolicySubjects.get(key);
    }
    if (!this.mapPolicySubjects.has(key)) {
      this.mapPolicySubjects.set(key, new Subject());
      this.checkAndNext(key, policy, this.mapPolicySubjects.get(key));
      return this.mapPolicySubjects.get(key);
    }
    return of(undefined);
  }
  featureSubject(policy: Partial<PolicyAsk>): Observable<boolean> {
    const key = this.getKeyByPolicy(policy);
    if (this.mapPolicyJSON[key]) {
      return of(this.getAccess(this.mapPolicyJSON[key]));
    }
    if (this.mapPolicySubjects.has(key)) {
      return this.mapPolicySubjects.get(key);
    }
    if (!this.mapPolicySubjects.has(key)) {
      this.mapPolicySubjects.set(key, new Subject());
      return this.mapPolicySubjects.get(key);
    }
    return of(undefined);
  }
  checkAndNext(
    key: string,
    policy: Partial<PolicyAsk>,
    subject: Subject<boolean>,
  ) {
    if (this.fetchTimeout || this.fetchTimeout === -1) {
      clearTimeout(this.fetchTimeout);
      this.observerMap[key] = { s: subject, p: policy };
    }
    this.fetchTimeout = globalThis.setTimeout(() => {
      const arr = Object.keys(this.observerMap).map(
        (k) => this.observerMap[k].p,
      );
      this.fetchTimeout = -1;
      this.checkPolicy(arr, true).subscribe((data) => {
        this.parseAcl(data.acl, '');
      });
    }, 50);
  }
  parseAcl(aclList: PolicyAnswer[], replaceId: string) {
    for (const acl of aclList) {
      if (replaceId) {
        acl.objectID = replaceId;
      }
      const key = this.getKeyByPolicy(acl);
      this.savePolicyByKey(key, acl.access);
      if (this.observerMap[key]) {
        if (this.observerMap[key].s) {
          this.observerMap[key].s.next(this.getAccess(acl.access));
        }
        this.observerMap[key].s = null;
        this.observerMap[key].p = null;
        this.observerMap[key] = null;
        delete this.observerMap[key];
      }
    }
  }

  getTransitAccessIssue = (select: RwSelectComponent, issue: Issue): void => {
    if (!select.opened) {
      this.canTransitIssue(issue.id).subscribe((data: boolean) => {
        if (data) {
          select.switchPopup();
        } else {
          this.toastService.error(
            `You don't have rights to change issue ${
              issue.key || issue.id
            } status`,
          );
        }
      });
    } else {
      select.switchPopup();
    }
  };
  getEditAccessFieldAssignes = (
    select: RwSelectComponent,
    issue: Issue,
  ): void => {
    if (!select.opened) {
      this.canEditFieldAssignes(issue.id).subscribe((data: boolean) => {
        if (data) {
          select.switchPopup();
        } else {
          this.toastService.error(
            `You don't have rights to change issue ${
              issue.key || issue.id
            } assignees`,
          );
        }
      });
    } else {
      select.switchPopup();
    }
  };
  getEditAccessFieldMilestones = (
    select: RwSelectComponent,
    issue: Issue,
  ): void => {
    if (!select.opened) {
      this.canEditFieldMilestones(issue.id).subscribe((data: boolean) => {
        if (data) {
          select.switchPopup();
        } else {
          this.toastService.error(
            `You don't have rights to change issue ${
              issue.key || issue.id
            } milestones`,
          );
        }
      });
    } else {
      select.switchPopup();
    }
  };
  getEditAccess = (select: RwSelectComponent, issue: Issue): void => {
    if (!select.opened) {
      this.canEditIssue(issue.id).subscribe((data: boolean) => {
        if (data) {
          select.switchPopup();
        } else {
          this.toastService.error(
            `You don't have rights to change issue ${
              issue.key || issue.id
            } milestones`,
          );
        }
      });
    } else {
      select.switchPopup();
    }
  };
}
