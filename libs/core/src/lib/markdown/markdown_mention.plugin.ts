import MarkdownIt from 'markdown-it';
import StateCore from 'markdown-it/lib/rules_core/state_core';
import Token from 'markdown-it/lib/token';

class MentionToken extends Token {
  directive: string;
  objectHref: string;
  linkclass: string;
}

const mentionOpen = (tokens: MentionToken[], idx: number) =>
    `<a class="${tokens[idx].linkclass}" [${tokens[idx].directive}]="'${tokens[idx].objectHref}'">`,
  mentionClose = () => '</a>',
  mentionText = (tokens: MentionToken[], idx: number) => tokens[idx].content,
  linkOpenRegExp = /^<a[>\s]/i,
  linkCloseRegExp = /^<\/a\s*>/i,
  isLinkOpen = (str: string) => linkOpenRegExp.test(str),
  isLinkClose = (str: string) => linkCloseRegExp.test(str),
  // mentionRegExpPattern = "@\\{(?:([^}]+); )?([^\\} ]+)\\}",
  mentionRegExpPattern =
    '\\B@([a-z0-9_]+)|\\B#([A-Za-z0-9-]+)|\\B@\\?([a-z0-9_]+)',
  mentionRegExp = new RegExp(mentionRegExpPattern),
  mentionRegExpGlobal = new RegExp(mentionRegExpPattern, 'g');

export default class MentionPlugin {
  escapeHtml: boolean;
  inMarkdownLink: boolean;
  markdownLinkStartLevel: number;
  htmlLinkLevel: number;
  constructor(md: MarkdownIt) {
    md.core.ruler.after('inline', 'mention', (state: StateCore) => {
      return this.parseMentions(state);
    });

    md.renderer.rules.mention_open = mentionOpen;
    md.renderer.rules.mention_text = mentionText;
    md.renderer.rules.mention_close = mentionClose;
  }
  parseMentions(state: StateCore): void {
    state.tokens.forEach((blockToken) => {
      if (blockToken.type !== 'inline') {
        return;
      }

      this.inMarkdownLink = false;
      this.htmlLinkLevel = 0;

      blockToken.children = blockToken.children
        .map((currentToken) => {
          if (
            this.skipMarkdownLink(currentToken) ||
            this.skipHtmlLink(currentToken) ||
            currentToken.type !== 'text'
          ) {
            return [currentToken];
          }
          return this.mentionTokens(currentToken, state);
        })
        .reduce((a, b) => a.concat(b), []);

      return;
    });
  }
  mentionTokens(currentToken: Token, state: StateCore): Token[] {
    let text = currentToken.content,
      level = currentToken.level,
      token: MentionToken;
    const tokens: Token[] = [];
    const matches = text.match(mentionRegExpGlobal);

    if (matches === null) {
      return [currentToken];
    }

    matches.forEach((match) => {
      const [matchedText] = mentionRegExp.exec(match);
      const pos = text.indexOf(match);

      if (pos > 0) {
        token = new MentionToken('text', '', 0);
        token.content = text.slice(0, pos);
        token.level = level;
        tokens.push(token);
      }

      token = new MentionToken('text', '', 0);
      let directive: string;
      let objectHref: string;
      if (match[0] === '@' && match[1] === '?') {
        directive = 'personalPageHref';
        objectHref = match.substring(2);
      } else if (match[0] === '@') {
        directive = 'personalPageHref';
        objectHref = match.substring(1);
      } else if (match[0] === '#') {
        directive = 'issueHref';
        objectHref = match.substring(1);
      }
      // objectHref = match;
      token.level = level;
      tokens.push(token);

      token = new MentionToken('mention_open', '', 1);
      token.directive = directive;
      token.objectHref = objectHref;
      // token.content = person.url || "/people/" + person.guid;
      // token.linkclass = mentionLinkClass(person);
      token.linkclass = 'mention';
      token.level = level++;
      tokens.push(token);

      token = new MentionToken('mention_text', '', 0);
      // token.content = this.escapeHtml(name ? name : person.name).trim();
      token.content = match;
      token.level = level;
      tokens.push(token);

      token = new MentionToken('mention_close', '', -1);
      token.level = --level;
      tokens.push(token);
      // } else {
      //   token = new state.Token('text', '', 0);
      //   token.content = name ? name : diasporaId;
      //   token.level = level;
      //   tokens.push(token);
      // }
      text = text.slice(pos + matchedText.length);
    });

    if (text.length > 0) {
      token = new MentionToken('text', '', 0);
      token.content = text;
      // FIXME
      // token.level = state.level;
      tokens.push(token);
    }

    return tokens;
  }

  /*
   * Skips content inside of inline html links
   * Modifies this.htmlLinkLevel to keep track of the current state
   */
  skipHtmlLink(currentToken: Token): boolean {
    if (currentToken.type === 'html_inline') {
      if (isLinkClose(currentToken.content) && this.htmlLinkLevel > 0) {
        this.htmlLinkLevel--;
      }
      if (isLinkOpen(currentToken.content)) {
        this.htmlLinkLevel++;
      }
    }
    return this.htmlLinkLevel > 0;
  }

  /*
   * Skips content inside of markdown links (between link_open and link_close)
   * Modifies this.inMarkdownLink and this.markdownLinkStartLevel to keep track of the current state
   */
  skipMarkdownLink(currentToken: Token): boolean {
    if (this.inMarkdownLink) {
      if (
        currentToken.level === this.markdownLinkStartLevel ||
        currentToken.type === 'link_close'
      ) {
        this.inMarkdownLink = false;
      }
      return true;
    }
    if (currentToken.type === 'link_open') {
      this.markdownLinkStartLevel = currentToken.level;
      this.inMarkdownLink = true;
      return true;
    }
    return false;
  }
}
