/* eslint-disable @typescript-eslint/no-unused-vars */
import {
  CharStream,
  CommonTokenStream,
  ErrorNode,
  ParseTree,
  ParseTreeListener,
  ParseTreeWalker,
  ParserRuleContext,
  RecognitionException,
  Recognizer,
  TerminalNode,
  Token,
} from 'antlr4';
import OQLLexer from './OQLLexer';
import OQLListener from './OQLListener';
import OQLParser, {
  AtomContext,
  FieldContext,
  LogicContext,
  RelopContext,
  SortAtomContext,
  ValueContext,
} from './OQLParser';

interface ParserIndex {
  start: number;
  stop: number;
  context: ParserRuleContext;
  index: number;
  type: number;
}

export class OQLParseListener implements OQLListener {
  errors: Array<{ char: number; message: string }> = [];
  index: Array<ParserIndex> = [];
  exp: Array<ParserIndex> = [];
  tree: ParseTree;
  query: string;

  constructor(query: string) {
    this.parseOQL(query);
  }

  private getContextDepth(ctx: ParserRuleContext) {
    let n = 0;
    let p = ctx;
    while (p) {
      p = p.parentCtx;
      n++;
    }
    return n;
  }
  private removeAtom(atom: AtomContext) {
    let start = atom.start.start;
    let stop = atom.stop.stop;

    const preContext = this.findContextInPosition(start);
    const postContext = this.findContextInPosition(stop);

    const prelogic = preContext ? this.index[preContext.index - 1] : undefined;
    const postlogic = postContext
      ? this.index[postContext.index + 1]
      : undefined;

    if (prelogic && prelogic.type === OQLParser.RULE_logic) {
      start = prelogic.context.start.start;
    }

    if (!prelogic && postlogic && postlogic.type === OQLParser.RULE_logic) {
      stop = postlogic.context.stop.stop;
    }

    this.query = (
      this.query.slice(0, start) + this.query.slice(stop + 1)
    ).trim();

    this.parseOQL(this.query);
    return this;
  }
  private convertValueToSearchString(value: string): string {
    if (value?.indexOf(' ') > -1) {
      return `"${value}"`;
    } else {
      return value;
    }
  }

  parseOQL(query: string) {
    if (!query) {
      return;
    }
    const inputStream = new CharStream(query);
    const lexer = new OQLLexer(inputStream);
    const tokenStream = new CommonTokenStream(lexer);
    const parser = new OQLParser(tokenStream);

    // lexer.removeErrorListeners();
    parser.removeErrorListeners();

    parser.addErrorListener({
      syntaxError: (
        recognizer: Recognizer<Token>,
        offendingSymbol: Token | undefined,
        line: number,
        charPositionInLine: number,
        msg: string,
        e: RecognitionException | undefined,
      ) => {
        this.errors.push({
          char: charPositionInLine,
          message: msg,
        });
      },
    });

    this.index = [];
    this.exp = [];
    this.errors = [];

    const walker = new ParseTreeWalker();
    const tree = parser.expression();
    walker.walk(this as ParseTreeListener, tree);
    this.tree = tree;
    this.query = query;
  }
  // Add map with positions
  enterField(ctx: FieldContext) {
    this.index.push({
      start: ctx.start.start,
      stop: Math.max(ctx.stop.stop, ctx.start.start),
      index: this.index.length,
      context: ctx,
      type: OQLParser.RULE_field,
    });
  }
  enterValue(ctx: ValueContext) {
    this.index.push({
      start: ctx.start.start,
      stop: Math.max(ctx.stop.stop, ctx.start.start),
      index: this.index.length,
      context: ctx,
      type: OQLParser.RULE_value,
    });
  }
  enterLogic(ctx: LogicContext) {
    this.index.push({
      start: ctx.start.start,
      stop: Math.max(ctx.stop.stop, ctx.start.start),
      index: this.index.length,
      context: ctx,
      type: OQLParser.RULE_logic,
    });
  }
  enterRelop(ctx: RelopContext) {
    this.index.push({
      start: ctx.start.start,
      stop: Math.max(ctx.stop.stop, ctx.start.start),
      index: this.index.length,
      context: ctx,
      type: OQLParser.RULE_relop,
    });
  }

  enterSortAtom(ctx: SortAtomContext) {
    if (ctx.start && ctx.stop) {
      this.exp.push({
        start: ctx.start.start,
        stop: ctx.stop.stop,
        index: this.index.length,
        context: ctx,
        type: OQLParser.RULE_sortAtom,
      });
    }
  }

  enterAtom(ctx: AtomContext) {
    if (ctx.start && ctx.stop) {
      this.exp.push({
        start: ctx.start.start,
        stop: ctx.stop.stop,
        index: this.index.length,
        context: ctx,
        type: OQLParser.RULE_atom,
      });
    }
  }
  visitTerminal(node: TerminalNode) {
    if (node.getText() === '(' || node.getText() === ')') {
      this.index.push({
        start: node.symbol.start,
        stop: node.symbol.stop,
        index: this.index.length,
        context: null,
        type: null,
      });
    }
  }

  findContextInPosition(pos: number): ParserIndex {
    for (const i of this.index) {
      if (pos >= i.start && pos <= i.stop) {
        return i;
      }
    }
    return null;
  }

  findExpContextInPosition(pos: number): ParserIndex {
    for (const i of this.exp) {
      if (pos >= i.start && pos <= i.stop) {
        return i;
      }
    }
    return null;
  }
  findAtomByName(name: string, depth?: number): ParserIndex[] {
    return this.exp
      .filter(
        (exp) =>
          exp.type === OQLParser.RULE_atom || exp.type === OQLParser.RULE_sortAtom,
      )
      .filter((exp) => exp.context.start.text === name)
      .filter((exp) => {
        exp.context;
        return depth !== undefined
          ? this.getContextDepth(exp.context) === depth
          : true;
      });
  }
  getValueInAtom(name: string, depth: number) {
    const indexes = this.findAtomByName(name, depth);
    if (indexes.length === 1) {
      const valueContext = indexes[0].context.children.find(
        (v) => v instanceof ValueContext,
      ) as ValueContext;
      const start = valueContext.start.start;
      const stop = valueContext.stop.stop;
      return this.query.slice(start, stop + 1).replace(/^"(.*?)"$/, '$1');
    }
    return '';
  }
  setValueInAtom(name: string, depth: number, value: string) {
    const indexes = this.findAtomByName(name, depth);
    const newValue = this.convertValueToSearchString(value);
    if (value) {
      if (indexes.length === 0) {
        this.query = `${name}=${value} ${this.query}`;
        this.parseOQL(this.query);
        return this;
      }
      if (indexes.length === 1) {
        const valueContext = indexes[0].context.children.find(
          (v) => v instanceof ValueContext,
        ) as ValueContext;
        const start = valueContext.start.start;
        const stop = valueContext.stop.stop;
        this.query = `${this.query.slice(
          0,
          start,
        )}${newValue}${this.query.slice(stop + 1)}`;
        this.parseOQL(this.query);
        return this;
      }
    }
    this.parseOQL(this.query);
    return this;
  }
  switchValueInAtom(name: string, depth: number, value: string) {
    const indexes = this.findAtomByName(name, depth);
    const current = this.convertValueToSearchString(
      this.getValueInAtom(name, depth),
    );
    const nextValue =
      current === this.convertValueToSearchString(value)
        ? undefined
        : this.convertValueToSearchString(value);
    if (nextValue) {
      if (indexes.length === 0) {
        if (name === 'sort') {
          this.query = `${this.query} ${name} = ${nextValue}`;
        } else {
          this.query = `${name} = ${nextValue} ${this.query}`;
        }
        this.parseOQL(this.query);
        return this;
      }
      if (indexes.length === 1) {
        const valueContext = indexes[0].context.children.find(
          (v) => v instanceof ValueContext,
        ) as ValueContext;

        const start = valueContext.start.start;
        const stop = valueContext.stop.stop;
        this.query = `${this.query.slice(
          0,
          start,
        )}${nextValue}${this.query.slice(stop + 1)}`;
        this.parseOQL(this.query);
        return this;
      }
    } else {
      if (indexes.length === 1) {
        this.removeAtom(indexes[0].context as AtomContext);
        this.parseOQL(this.query);
        return this;
      }
    }
    this.parseOQL(this.query);
    return this;
  }
  visitErrorNode(node: ErrorNode): void {
    return;
  }
  enterEveryRule(ctx: ParserRuleContext): void {
    return;
  }
  exitEveryRule(ctx: ParserRuleContext): void {
    return;
  }
}
