/** Slash command shown in chat ProseMirror autocomplete (`/`). */
export interface ChatCommand {
  id: string;
  /** Full command text inserted into the editor, e.g. `/refresh`. */
  command: string;
  label: string;
  description?: string;
}
