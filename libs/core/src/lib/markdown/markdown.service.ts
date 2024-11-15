import {
  ComponentFactoryResolver,
  ComponentRef,
  Injectable,
  Injector,
} from '@angular/core';
import { Router } from '@angular/router';
import { RwModalService } from '@renwu/components';
import MarkdownIt from 'markdown-it';
import markdownitEmoji from 'markdown-it-emoji';
// import { IssueStripeItemComponent } from 'src/app-old/shared/items/stripe/stripe.component';
import { RwDataService } from '../data/data.service';
import { ImageViewerComponent } from '../image-viewer/image-viewer.component';
import { RwUserService } from '../user/user.service';
import MentionPlugin from './markdown_mention.plugin';

@Injectable({
  providedIn: 'root',
})
export class RwMarkdownService {
  linkToComponent: Map<any, any[]> = new Map();
  linkToElement: Map<any, any[]> = new Map();
  markdown: any;
  mdPlugin: MentionPlugin;
  constructor(
    private router: Router,
    private dataService: RwDataService,
    private modalService: RwModalService,
    private userService: RwUserService,
    private componentFactoryResolver: ComponentFactoryResolver,
    private injector: Injector,
  ) {
    this.markdown = new MarkdownIt({
      linkify: true,
      breaks: true,
      html: true,
    });

    this.mdPlugin = new MentionPlugin(this.markdown);

    this.markdown.use(markdownitEmoji, {
      defs: emojies_defs,
      shortcuts: {
        white_check_mark: ['(+)'],
        large_blue_circle: ['(=)'],
        red_circle: ['(-)'],
        white_circle: ['( )'],
        exclamation: ['(!)'],
        question: ['(?)'],
        information_source: ['(i)'],
      },
      enabled: [],
    });
    // Remember old renderer, if overriden, or proxy to default renderer
    const defaultRender =
      this.markdown.renderer.rules.link_open ||
      function (tokens, idx, options, env, self) {
        return self.renderToken(tokens, idx, options);
      };

    this.markdown.renderer.rules.link_open = function (
      tokens,
      idx,
      options,
      env,
      self,
    ) {
      // If you are sure other plugins can't add `target` - drop check below
      const aIndex = tokens[idx].attrIndex('target');

      if (aIndex < 0) {
        tokens[idx].attrPush(['target', '_blank']); // add new attribute
      } else {
        tokens[idx].attrs[aIndex][1] = '_blank'; // replace value of existing attr
      }

      // pass token to default renderer.
      return defaultRender(tokens, idx, options, env, self);
    };

    this.markdown.renderer.rules.emoji = function (token, idx) {
      return `<i class="em em-${token[idx].markup}"></i>`;
    };
  }
  render(text: string): string {
    if (!text) {
      return '';
    }
    // Jira table
    text = text.replace(
      /^(\|\|)+((.|[\s\S])*?)(\|\|)+(.?)+$/gm,
      function (p1, p2, p3, p4, p5) {
        p1 = p1.replace(/\n/g, '');
        p1 = p1.replace(/\r/g, '');
        p1 = p1.replace(/\|\|/g, '|');
        p1 = p1 + '\n' + p1.replace(/[^\|]/g, '-');
        return p1;
      },
    );
    // Code block
    text = text.replace(/\{code\:(.*?)\}/g, '```$1');
    text = text.replace(/\{code\}/g, '```');
    return this.markdown.render(text);
  }
  openPersonalPage(username: string): void {
    this.router.navigate([{ outlets: { user: [username] } }]);
  }
  prepareLinks(element: HTMLElement, caller: any, depth = 0): void {
    if (depth > 3) {
      return;
    }
    const anchors = Array.from(element.getElementsByTagName('a')).filter(
      (item) => !item.hasAttribute('skip'),
    );
    const images = Array.from(element.getElementsByTagName('img'));

    const links = [...anchors, ...images];

    // const issueStripeComponentFactory =
    //   this.componentFactoryResolver.resolveComponentFactory(
    //     IssueStripeItemComponent,
    //   );

    const components: ComponentRef<any>[] = [];
    const loadKeys: Map<string, any> = new Map();

    for (const anchor of anchors) {
      anchor.addEventListener(
        'mouseup',
        (event) => {
          event.stopImmediatePropagation();
        },
        true,
      );
    }

    for (const link of links) {
      const element = link as HTMLElement;
      const mention = link.innerHTML;
      const fullLink = link.outerHTML;

      const outletLinkRegexp = /issue:(\w+\-\d+)/gi;
      const outletLink = outletLinkRegexp.exec(fullLink) || [];

      const directLinkRegexp = /issue\/(\w+\-\d+)/gi;
      const directLink = directLinkRegexp.exec(fullLink) || [];

      const messageLinkRegexp = /message\/(.{24})\/(\d)\/(.{24})/gi;
      const messageLink = messageLinkRegexp.exec(fullLink) || [];

      if (mention[0] === '@' && mention[1] === '?') {
        const user = this.userService.getUserByUsername(
          element.innerHTML.substring(2),
        );
        if (user) {
          element.nodeValue = this.userService.getDisplayName(user);
          element.addEventListener('click', () => {
            this.openPersonalPage(user.username);
          });
        }
      } else if (mention[0] === '@') {
        const user = this.userService.getUserByUsername(
          link.innerHTML.substring(1),
        );
        if (user) {
          element.nodeValue = this.userService.getDisplayName(user);
          element.addEventListener('click', () => {
            this.openPersonalPage(user.username);
          });
        }
      } else if (mention[0] === '#' || outletLink[1] || directLink[1]) {
        // const key =
        //   directLink[1] || outletLink[1] || link.innerHTML.substring(1);
        // this.dataService
        //   .getIssuesByKeyBackgroundBuffered(key)
        //   .subscribe((issue) => {
        //     const component = issueStripeComponentFactory.create(this.injector);
        //     component.instance.issue = issue;
        //     component.instance.inline = true;
        //     component.instance.checkboxDisabled = true;
        //     component.changeDetectorRef.detectChanges();
        //     components.push(component);
        //     element.replaceWith(component.location.nativeElement);
        //     // prevent
        //     component.location.nativeElement.addEventListener(
        //       'mouseup',
        //       (event) => {
        //         event.stopImmediatePropagation();
        //       },
        //       true,
        //     );
        //   });
        // element.addEventListener('click', () => {
        //   const key = link.innerHTML.substring(1);
        //   this.issueService.openIssue({ key }).subscribe();
        // });
      } else if (messageLink[1] && messageLink[2] && messageLink[3]) {
        const linkHref = link.getAttribute('href');
        this.dataService.getMessage(messageLink[3]).subscribe((message) => {
          const m = this.render(message.message);
          const html = document.createElement('p');
          html.className = 'quoted-message';
          html.innerHTML = `<a skip="true" class="author" href="${linkHref}">&gt; message from ${this.userService.getDisplayName(
            message.author,
          )}:</a></br>${m}`;
          this.prepareLinks(html, html, depth);
          link.parentNode.replaceChild(html, link);
        });
      } else if (link.localName === 'img') {
        element.addEventListener('click', () => {
          const images = [
            {
              href: link.getAttribute('src'),
              href_file_name: link.getAttribute('src'),
              id: '',
              url: '',
            },
          ];

          this.modalService.add(
            ImageViewerComponent,
            { currentIndex: 0, images: images },
            'overlay',
          );
        });
      }
    }
    if (loadKeys.size > 0) {
    }
    this.linkToComponent.set(caller, components);
    this.linkToElement.set(caller, links);
    depth++;
  }

  cleanupLinks(caller: any): void {
    const components = this.linkToComponent.get(caller) || [];
    for (let i = 0; i < components.length; ++i) {
      components[i].destroy();
    }

    const links = this.linkToElement.get(caller) || [];
    for (let i = 0; i < links.length; ++i) {
      // FIXME: Remove all listeners
      // jQuery(links[i]).off();
    }
    this.linkToComponent.set(caller, []);
  }
}
