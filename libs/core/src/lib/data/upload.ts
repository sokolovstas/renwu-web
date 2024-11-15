import { Attachment } from '../issue/issue.model';

export interface FileUpload extends Attachment {
  name: string;
  __loaded?: boolean;
  __progress?: number;
  __error?: ProgressEvent;
}

export interface FileWithName {
  file: File;
  fileName: string;
}
