import { SelectModelBase } from '@renwu/components';

export class SelectModelLabel extends SelectModelBase<string> {
  constructor(createNewOption: boolean, many: boolean) {
    super();
    this.many = many;
    this.createNewOption = createNewOption;
  }
}
