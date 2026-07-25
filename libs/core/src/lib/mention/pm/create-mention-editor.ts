import { ApplicationRef, EnvironmentInjector, inject } from '@angular/core';
import { Plugin } from 'prosemirror-state';
import { NodeViewConstructor } from 'prosemirror-view';
import { RwMentionsProviderService } from '../mentions.service';
import { createAngularNodeView } from './angular-node-view';
import { createMentionAutocompletePlugin } from './mention-autocomplete.plugin';
import { MentionIssueStripeComponent } from './mention-issue-stripe.component';
import { MentionUserChipComponent } from './mention-user-chip.component';

export interface MentionEditorExtras {
  plugins: Plugin[];
  nodeViews: Record<string, NodeViewConstructor>;
}

/**
 * Build ProseMirror plugins + NodeViews for @user / #issue mentions.
 * Call from an injection context (component constructor / field initializer).
 */
export function createMentionEditorExtras(options?: {
  onActiveChange?: (active: boolean) => void;
}): MentionEditorExtras {
  const environmentInjector = inject(EnvironmentInjector);
  const applicationRef = inject(ApplicationRef);
  const providers = inject(RwMentionsProviderService);

  const nodeViews: Record<string, NodeViewConstructor> = {
    mention_user: createAngularNodeView({
      component: MentionUserChipComponent,
      environmentInjector,
      applicationRef,
      inputs: (node) => ({ username: node.attrs['username'] }),
    }),
    mention_issue: createAngularNodeView({
      component: MentionIssueStripeComponent,
      environmentInjector,
      applicationRef,
      inputs: (node) => ({ key: node.attrs['key'] }),
    }),
  };

  const plugins = [
    createMentionAutocompletePlugin({
      providers: [providers.getUser(), providers.getIssue()],
      environmentInjector,
      applicationRef,
      onActiveChange: options?.onActiveChange,
    }),
  ];

  return { plugins, nodeViews };
}
