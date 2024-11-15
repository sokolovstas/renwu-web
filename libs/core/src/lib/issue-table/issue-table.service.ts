import { Injectable, inject } from '@angular/core';
import { Observable, first, merge, pipe, repeat, skip, tap } from 'rxjs';
import { Issue } from '../issue/issue.model';
import { RwWebsocketService } from '../websocket/websocket.service';

@Injectable()
export class IssueTableService {
  websocketService = inject(RwWebsocketService);

  getRefreshedList(o?: Observable<unknown>) {
    let containers: string[];
    return pipe(
      tap((issues: Issue[]) => {
        const containers = Array.from(
          issues
            .reduce((acc, val) => acc.add(val.container.id), new Set<string>())
            .keys(),
        );
        this.websocketService.clearId('issuelist');
        containers.forEach((c) => {
          this.websocketService.pushId('issuelist', c);
        });
        this.websocketService.sendView();
      }),
      first(),
      // switchMap((v) => new BehaviorSubject(v)),
      // share(),
      // takeUntil(this.websocketService.onIssueEvent(containers)),
      repeat({
        delay: () => {
          if (o) {
            return merge(
              this.websocketService.onIssueEvent(containers),
              o.pipe(skip(1)),
            );
          } else {
            return this.websocketService.onIssueEvent(containers);
          }
        },
      }),
      //
      // repeat()
    );
  }
}
