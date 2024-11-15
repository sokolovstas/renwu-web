import { ISelectItem, SelectModelBase } from '@renwu/components';

export class SelectModelString extends SelectModelBase<string> {
  constructor(data: ISelectItem<string>[]) {
    super();
    this.loadSelected = true;
    this.staticData = data;
  }
}
