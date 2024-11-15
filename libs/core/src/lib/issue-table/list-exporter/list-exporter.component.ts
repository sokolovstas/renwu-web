import { Component, Input } from '@angular/core';


import { FormsModule } from '@angular/forms';
import { TranslocoPipe } from '@ngneat/transloco';
import {
  RwButtonComponent,
  RwModalBodyDirective,
  RwModalComponent,
  RwModalHeaderDirective,
  RwTextInputComponent,
} from '@renwu/components';
import { JSONUtils, getObjectValue } from '@renwu/utils';
import { Issue } from '../../issue/issue.model';
@Component({
  selector: 'renwu-issue-list-exporter-modal',
  standalone: true,
  imports: [
    RwModalBodyDirective,
    RwModalComponent,
    RwModalHeaderDirective,
    RwButtonComponent,
    RwTextInputComponent,
    FormsModule,
    TranslocoPipe
],
  templateUrl: './list-exporter.component.html',
  styleUrl: './list-exporter.component.scss',
})
export class ListExporterComponent {
  @Input()
  list: Issue[];

  templates: any = {};

  initialTemplates = {
    list: '<b><a href="%url%">%key%</a> | %status.label%</b> <br/> %title%<br/><br/>',
    markdown:
      '- **%key%** | **%type.label%** | **%status.label%** <br/> %title%',
    stripes: '- #%key% %title%',
    html: `&lt;a href=&quot;%url%&quot;&gt;%key%&lt;/a&gt; | %type.label% | %status.label% &lt;br/&gt; %title%&lt;br/&gt;&lt;br/&gt;`,
  };

  keys: string[];
  origin: string;
  format = 'list';

  constructor() {
    this.origin = window.location.origin;
    Object.assign(
      this.templates,
      this.initialTemplates,
      JSONUtils.parseLocalStorage('renwu_export_format', {}),
    );
  }

  renderTemplate(item: any, template: string): string {
    if (!item) {
      return '';
    }

    const result = template.replace(
      /%(.*?)%/gi,
      (substring: string, key: string) => {
        if (key === 'url') {
          return `${this.origin}/task/list/(section:task/${item.key})`;
        }
        const value = getObjectValue(item, key);
        return value;
      },
    );
    return result;
  }
  saveCustom(value: string) {
    this.templates[this.format] = value;
    JSONUtils.setLocalStorage('renwu_export_format', this.templates);
  }
}
