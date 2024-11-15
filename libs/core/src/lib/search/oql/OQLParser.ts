// Generated from libs/core/src/lib/search/oql/OQL.g4 by ANTLR 4.13.1
// noinspection ES6UnusedImports,JSUnusedGlobalSymbols,JSUnusedLocalSymbols

import {
  ATN,
  ATNDeserializer,
  DecisionState,
  DFA,
  FailedPredicateException,
  RecognitionException,
  NoViableAltException,
  BailErrorStrategy,
  Parser,
  ParserATNSimulator,
  RuleContext,
  ParserRuleContext,
  PredictionMode,
  PredictionContextCache,
  TerminalNode,
  RuleNode,
  Token,
  TokenStream,
  Interval,
  IntervalSet,
} from 'antlr4';
import OQLListener from './OQLListener.js';
// for running tests with parameters, TODO: discuss strategy for typed parameters in CI
// eslint-disable-next-line no-unused-vars
type int = number;

export default class OQLParser extends Parser {
  public static readonly T__0 = 1;
  public static readonly T__1 = 2;
  public static readonly T__2 = 3;
  public static readonly T__3 = 4;
  public static readonly LPAREN = 5;
  public static readonly RPAREN = 6;
  public static readonly EQ = 7;
  public static readonly GT = 8;
  public static readonly LT = 9;
  public static readonly NEQ = 10;
  public static readonly GTE = 11;
  public static readonly LTE = 12;
  public static readonly COMMA = 13;
  public static readonly AND = 14;
  public static readonly OR = 15;
  public static readonly NOR = 16;
  public static readonly STRING = 17;
  public static readonly SPACE = 18;
  public static readonly NEWLINE = 19;
  public static override readonly EOF = Token.EOF;
  public static readonly RULE_atom = 0;
  public static readonly RULE_sortAtom = 1;
  public static readonly RULE_expression = 2;
  public static readonly RULE_relop = 3;
  public static readonly RULE_logic = 4;
  public static readonly RULE_and = 5;
  public static readonly RULE_or = 6;
  public static readonly RULE_nor = 7;
  public static readonly RULE_field = 8;
  public static readonly RULE_sort = 9;
  public static readonly RULE_value = 10;
  public static readonly literalNames: (string | null)[] = [
    null,
    "'and'",
    "'or'",
    "'nor'",
    "'sort'",
    "'('",
    "')'",
    "'='",
    "'>'",
    "'<'",
    "'!='",
    "'>='",
    "'<='",
    "','",
    "'AND'",
    "'OR'",
    "'NOR'",
    null,
    "' '",
  ];
  public static readonly symbolicNames: (string | null)[] = [
    null,
    null,
    null,
    null,
    null,
    'LPAREN',
    'RPAREN',
    'EQ',
    'GT',
    'LT',
    'NEQ',
    'GTE',
    'LTE',
    'COMMA',
    'AND',
    'OR',
    'NOR',
    'STRING',
    'SPACE',
    'NEWLINE',
  ];
  // tslint:disable:no-trailing-whitespace
  public static readonly ruleNames: string[] = [
    'atom',
    'sortAtom',
    'expression',
    'relop',
    'logic',
    'and',
    'or',
    'nor',
    'field',
    'sort',
    'value',
  ];
  public get grammarFileName(): string {
    return 'OQL.g4';
  }
  public get literalNames(): (string | null)[] {
    return OQLParser.literalNames;
  }
  public get symbolicNames(): (string | null)[] {
    return OQLParser.symbolicNames;
  }
  public get ruleNames(): string[] {
    return OQLParser.ruleNames;
  }
  public get serializedATN(): number[] {
    return OQLParser._serializedATN;
  }

  protected createFailedPredicateException(
    predicate?: string,
    message?: string,
  ): FailedPredicateException {
    return new FailedPredicateException(this, predicate, message);
  }

  constructor(input: TokenStream) {
    super(input);
    this._interp = new ParserATNSimulator(
      this,
      OQLParser._ATN,
      OQLParser.DecisionsToDFA,
      new PredictionContextCache(),
    );
  }
  // @RuleVersion(0)
  public atom(): AtomContext {
    let localctx: AtomContext = new AtomContext(this, this._ctx, this.state);
    this.enterRule(localctx, 0, OQLParser.RULE_atom);
    let _la: number;
    try {
      this.state = 42;
      this._errHandler.sync(this);
      switch (this._input.LA(1)) {
        case 17:
          this.enterOuterAlt(localctx, 1);
          {
            this.state = 22;
            this.field();
            this.state = 26;
            this._errHandler.sync(this);
            _la = this._input.LA(1);
            while (_la === 18) {
              {
                {
                  this.state = 23;
                  this.match(OQLParser.SPACE);
                }
              }
              this.state = 28;
              this._errHandler.sync(this);
              _la = this._input.LA(1);
            }
            this.state = 29;
            this.relop();
            this.state = 33;
            this._errHandler.sync(this);
            _la = this._input.LA(1);
            while (_la === 18) {
              {
                {
                  this.state = 30;
                  this.match(OQLParser.SPACE);
                }
              }
              this.state = 35;
              this._errHandler.sync(this);
              _la = this._input.LA(1);
            }
            this.state = 36;
            this.value();
          }
          break;
        case 5:
          this.enterOuterAlt(localctx, 2);
          {
            this.state = 38;
            this.match(OQLParser.LPAREN);
            this.state = 39;
            this.expression();
            this.state = 40;
            this.match(OQLParser.RPAREN);
          }
          break;
        default:
          throw new NoViableAltException(this);
      }
    } catch (re) {
      if (re instanceof RecognitionException) {
        localctx.exception = re;
        this._errHandler.reportError(this, re);
        this._errHandler.recover(this, re);
      } else {
        throw re;
      }
    } finally {
      this.exitRule();
    }
    return localctx;
  }
  // @RuleVersion(0)
  public sortAtom(): SortAtomContext {
    let localctx: SortAtomContext = new SortAtomContext(
      this,
      this._ctx,
      this.state,
    );
    this.enterRule(localctx, 2, OQLParser.RULE_sortAtom);
    let _la: number;
    try {
      this.enterOuterAlt(localctx, 1);
      {
        this.state = 44;
        this.sort();
        this.state = 48;
        this._errHandler.sync(this);
        _la = this._input.LA(1);
        while (_la === 18) {
          {
            {
              this.state = 45;
              this.match(OQLParser.SPACE);
            }
          }
          this.state = 50;
          this._errHandler.sync(this);
          _la = this._input.LA(1);
        }
        this.state = 51;
        this.match(OQLParser.EQ);
        this.state = 55;
        this._errHandler.sync(this);
        _la = this._input.LA(1);
        while (_la === 18) {
          {
            {
              this.state = 52;
              this.match(OQLParser.SPACE);
            }
          }
          this.state = 57;
          this._errHandler.sync(this);
          _la = this._input.LA(1);
        }
        this.state = 58;
        this.value();
      }
    } catch (re) {
      if (re instanceof RecognitionException) {
        localctx.exception = re;
        this._errHandler.reportError(this, re);
        this._errHandler.recover(this, re);
      } else {
        throw re;
      }
    } finally {
      this.exitRule();
    }
    return localctx;
  }
  // @RuleVersion(0)
  public expression(): ExpressionContext {
    let localctx: ExpressionContext = new ExpressionContext(
      this,
      this._ctx,
      this.state,
    );
    this.enterRule(localctx, 4, OQLParser.RULE_expression);
    let _la: number;
    try {
      let _alt: number;
      this.enterOuterAlt(localctx, 1);
      {
        this.state = 60;
        this.atom();
        this.state = 80;
        this._errHandler.sync(this);
        _alt = this._interp.adaptivePredict(this._input, 8, this._ctx);
        while (_alt !== 2 && _alt !== ATN.INVALID_ALT_NUMBER) {
          if (_alt === 1) {
            {
              {
                this.state = 62;
                this._errHandler.sync(this);
                _la = this._input.LA(1);
                do {
                  {
                    {
                      this.state = 61;
                      this.match(OQLParser.SPACE);
                    }
                  }
                  this.state = 64;
                  this._errHandler.sync(this);
                  _la = this._input.LA(1);
                } while (_la === 18);
                this.state = 74;
                this._errHandler.sync(this);
                _la = this._input.LA(1);
                while ((_la & ~0x1f) === 0 && ((1 << _la) & 114702) !== 0) {
                  {
                    {
                      this.state = 66;
                      this.logic();
                      this.state = 68;
                      this._errHandler.sync(this);
                      _la = this._input.LA(1);
                      do {
                        {
                          {
                            this.state = 67;
                            this.match(OQLParser.SPACE);
                          }
                        }
                        this.state = 70;
                        this._errHandler.sync(this);
                        _la = this._input.LA(1);
                      } while (_la === 18);
                    }
                  }
                  this.state = 76;
                  this._errHandler.sync(this);
                  _la = this._input.LA(1);
                }
                this.state = 77;
                this.atom();
              }
            }
          }
          this.state = 82;
          this._errHandler.sync(this);
          _alt = this._interp.adaptivePredict(this._input, 8, this._ctx);
        }
        this.state = 91;
        this._errHandler.sync(this);
        _alt = this._interp.adaptivePredict(this._input, 10, this._ctx);
        while (_alt !== 2 && _alt !== ATN.INVALID_ALT_NUMBER) {
          if (_alt === 1) {
            {
              {
                this.state = 84;
                this._errHandler.sync(this);
                _la = this._input.LA(1);
                do {
                  {
                    {
                      this.state = 83;
                      this.match(OQLParser.SPACE);
                    }
                  }
                  this.state = 86;
                  this._errHandler.sync(this);
                  _la = this._input.LA(1);
                } while (_la === 18);
                this.state = 88;
                this.sortAtom();
              }
            }
          }
          this.state = 93;
          this._errHandler.sync(this);
          _alt = this._interp.adaptivePredict(this._input, 10, this._ctx);
        }
        this.state = 97;
        this._errHandler.sync(this);
        _la = this._input.LA(1);
        while (_la === 18) {
          {
            {
              this.state = 94;
              this.match(OQLParser.SPACE);
            }
          }
          this.state = 99;
          this._errHandler.sync(this);
          _la = this._input.LA(1);
        }
      }
    } catch (re) {
      if (re instanceof RecognitionException) {
        localctx.exception = re;
        this._errHandler.reportError(this, re);
        this._errHandler.recover(this, re);
      } else {
        throw re;
      }
    } finally {
      this.exitRule();
    }
    return localctx;
  }
  // @RuleVersion(0)
  public relop(): RelopContext {
    let localctx: RelopContext = new RelopContext(this, this._ctx, this.state);
    this.enterRule(localctx, 6, OQLParser.RULE_relop);
    let _la: number;
    try {
      this.enterOuterAlt(localctx, 1);
      {
        this.state = 100;
        _la = this._input.LA(1);
        if (!((_la & ~0x1f) === 0 && ((1 << _la) & 8064) !== 0)) {
          this._errHandler.recoverInline(this);
        } else {
          this._errHandler.reportMatch(this);
          this.consume();
        }
      }
    } catch (re) {
      if (re instanceof RecognitionException) {
        localctx.exception = re;
        this._errHandler.reportError(this, re);
        this._errHandler.recover(this, re);
      } else {
        throw re;
      }
    } finally {
      this.exitRule();
    }
    return localctx;
  }
  // @RuleVersion(0)
  public logic(): LogicContext {
    let localctx: LogicContext = new LogicContext(this, this._ctx, this.state);
    this.enterRule(localctx, 8, OQLParser.RULE_logic);
    try {
      this.state = 108;
      this._errHandler.sync(this);
      switch (this._input.LA(1)) {
        case 14:
          this.enterOuterAlt(localctx, 1);
          {
            this.state = 102;
            this.match(OQLParser.AND);
          }
          break;
        case 15:
          this.enterOuterAlt(localctx, 2);
          {
            this.state = 103;
            this.match(OQLParser.OR);
          }
          break;
        case 16:
          this.enterOuterAlt(localctx, 3);
          {
            this.state = 104;
            this.match(OQLParser.NOR);
          }
          break;
        case 1:
          this.enterOuterAlt(localctx, 4);
          {
            this.state = 105;
            this.and();
          }
          break;
        case 2:
          this.enterOuterAlt(localctx, 5);
          {
            this.state = 106;
            this.or();
          }
          break;
        case 3:
          this.enterOuterAlt(localctx, 6);
          {
            this.state = 107;
            this.nor();
          }
          break;
        default:
          throw new NoViableAltException(this);
      }
    } catch (re) {
      if (re instanceof RecognitionException) {
        localctx.exception = re;
        this._errHandler.reportError(this, re);
        this._errHandler.recover(this, re);
      } else {
        throw re;
      }
    } finally {
      this.exitRule();
    }
    return localctx;
  }
  // @RuleVersion(0)
  public and(): AndContext {
    let localctx: AndContext = new AndContext(this, this._ctx, this.state);
    this.enterRule(localctx, 10, OQLParser.RULE_and);
    try {
      this.enterOuterAlt(localctx, 1);
      {
        this.state = 110;
        this.match(OQLParser.T__0);
      }
    } catch (re) {
      if (re instanceof RecognitionException) {
        localctx.exception = re;
        this._errHandler.reportError(this, re);
        this._errHandler.recover(this, re);
      } else {
        throw re;
      }
    } finally {
      this.exitRule();
    }
    return localctx;
  }
  // @RuleVersion(0)
  public or(): OrContext {
    let localctx: OrContext = new OrContext(this, this._ctx, this.state);
    this.enterRule(localctx, 12, OQLParser.RULE_or);
    try {
      this.enterOuterAlt(localctx, 1);
      {
        this.state = 112;
        this.match(OQLParser.T__1);
      }
    } catch (re) {
      if (re instanceof RecognitionException) {
        localctx.exception = re;
        this._errHandler.reportError(this, re);
        this._errHandler.recover(this, re);
      } else {
        throw re;
      }
    } finally {
      this.exitRule();
    }
    return localctx;
  }
  // @RuleVersion(0)
  public nor(): NorContext {
    let localctx: NorContext = new NorContext(this, this._ctx, this.state);
    this.enterRule(localctx, 14, OQLParser.RULE_nor);
    try {
      this.enterOuterAlt(localctx, 1);
      {
        this.state = 114;
        this.match(OQLParser.T__2);
      }
    } catch (re) {
      if (re instanceof RecognitionException) {
        localctx.exception = re;
        this._errHandler.reportError(this, re);
        this._errHandler.recover(this, re);
      } else {
        throw re;
      }
    } finally {
      this.exitRule();
    }
    return localctx;
  }
  // @RuleVersion(0)
  public field(): FieldContext {
    let localctx: FieldContext = new FieldContext(this, this._ctx, this.state);
    this.enterRule(localctx, 16, OQLParser.RULE_field);
    try {
      this.enterOuterAlt(localctx, 1);
      {
        this.state = 116;
        this.match(OQLParser.STRING);
      }
    } catch (re) {
      if (re instanceof RecognitionException) {
        localctx.exception = re;
        this._errHandler.reportError(this, re);
        this._errHandler.recover(this, re);
      } else {
        throw re;
      }
    } finally {
      this.exitRule();
    }
    return localctx;
  }
  // @RuleVersion(0)
  public sort(): SortContext {
    let localctx: SortContext = new SortContext(this, this._ctx, this.state);
    this.enterRule(localctx, 18, OQLParser.RULE_sort);
    try {
      this.enterOuterAlt(localctx, 1);
      {
        this.state = 118;
        this.match(OQLParser.T__3);
      }
    } catch (re) {
      if (re instanceof RecognitionException) {
        localctx.exception = re;
        this._errHandler.reportError(this, re);
        this._errHandler.recover(this, re);
      } else {
        throw re;
      }
    } finally {
      this.exitRule();
    }
    return localctx;
  }
  // @RuleVersion(0)
  public value(): ValueContext {
    let localctx: ValueContext = new ValueContext(this, this._ctx, this.state);
    this.enterRule(localctx, 20, OQLParser.RULE_value);
    let _la: number;
    try {
      this.enterOuterAlt(localctx, 1);
      {
        this.state = 120;
        this.match(OQLParser.STRING);
        this.state = 125;
        this._errHandler.sync(this);
        _la = this._input.LA(1);
        while (_la === 13) {
          {
            {
              this.state = 121;
              this.match(OQLParser.COMMA);
              this.state = 122;
              this.match(OQLParser.STRING);
            }
          }
          this.state = 127;
          this._errHandler.sync(this);
          _la = this._input.LA(1);
        }
      }
    } catch (re) {
      if (re instanceof RecognitionException) {
        localctx.exception = re;
        this._errHandler.reportError(this, re);
        this._errHandler.recover(this, re);
      } else {
        throw re;
      }
    } finally {
      this.exitRule();
    }
    return localctx;
  }

  public static readonly _serializedATN: number[] = [
    4, 1, 19, 129, 2, 0, 7, 0, 2, 1, 7, 1, 2, 2, 7, 2, 2, 3, 7, 3, 2, 4, 7, 4,
    2, 5, 7, 5, 2, 6, 7, 6, 2, 7, 7, 7, 2, 8, 7, 8, 2, 9, 7, 9, 2, 10, 7, 10, 1,
    0, 1, 0, 5, 0, 25, 8, 0, 10, 0, 12, 0, 28, 9, 0, 1, 0, 1, 0, 5, 0, 32, 8, 0,
    10, 0, 12, 0, 35, 9, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 3, 0, 43, 8, 0,
    1, 1, 1, 1, 5, 1, 47, 8, 1, 10, 1, 12, 1, 50, 9, 1, 1, 1, 1, 1, 5, 1, 54, 8,
    1, 10, 1, 12, 1, 57, 9, 1, 1, 1, 1, 1, 1, 2, 1, 2, 4, 2, 63, 8, 2, 11, 2,
    12, 2, 64, 1, 2, 1, 2, 4, 2, 69, 8, 2, 11, 2, 12, 2, 70, 5, 2, 73, 8, 2, 10,
    2, 12, 2, 76, 9, 2, 1, 2, 5, 2, 79, 8, 2, 10, 2, 12, 2, 82, 9, 2, 1, 2, 4,
    2, 85, 8, 2, 11, 2, 12, 2, 86, 1, 2, 5, 2, 90, 8, 2, 10, 2, 12, 2, 93, 9, 2,
    1, 2, 5, 2, 96, 8, 2, 10, 2, 12, 2, 99, 9, 2, 1, 3, 1, 3, 1, 4, 1, 4, 1, 4,
    1, 4, 1, 4, 1, 4, 3, 4, 109, 8, 4, 1, 5, 1, 5, 1, 6, 1, 6, 1, 7, 1, 7, 1, 8,
    1, 8, 1, 9, 1, 9, 1, 10, 1, 10, 1, 10, 5, 10, 124, 8, 10, 10, 10, 12, 10,
    127, 9, 10, 1, 10, 0, 0, 11, 0, 2, 4, 6, 8, 10, 12, 14, 16, 18, 20, 0, 1, 1,
    0, 7, 12, 135, 0, 42, 1, 0, 0, 0, 2, 44, 1, 0, 0, 0, 4, 60, 1, 0, 0, 0, 6,
    100, 1, 0, 0, 0, 8, 108, 1, 0, 0, 0, 10, 110, 1, 0, 0, 0, 12, 112, 1, 0, 0,
    0, 14, 114, 1, 0, 0, 0, 16, 116, 1, 0, 0, 0, 18, 118, 1, 0, 0, 0, 20, 120,
    1, 0, 0, 0, 22, 26, 3, 16, 8, 0, 23, 25, 5, 18, 0, 0, 24, 23, 1, 0, 0, 0,
    25, 28, 1, 0, 0, 0, 26, 24, 1, 0, 0, 0, 26, 27, 1, 0, 0, 0, 27, 29, 1, 0, 0,
    0, 28, 26, 1, 0, 0, 0, 29, 33, 3, 6, 3, 0, 30, 32, 5, 18, 0, 0, 31, 30, 1,
    0, 0, 0, 32, 35, 1, 0, 0, 0, 33, 31, 1, 0, 0, 0, 33, 34, 1, 0, 0, 0, 34, 36,
    1, 0, 0, 0, 35, 33, 1, 0, 0, 0, 36, 37, 3, 20, 10, 0, 37, 43, 1, 0, 0, 0,
    38, 39, 5, 5, 0, 0, 39, 40, 3, 4, 2, 0, 40, 41, 5, 6, 0, 0, 41, 43, 1, 0, 0,
    0, 42, 22, 1, 0, 0, 0, 42, 38, 1, 0, 0, 0, 43, 1, 1, 0, 0, 0, 44, 48, 3, 18,
    9, 0, 45, 47, 5, 18, 0, 0, 46, 45, 1, 0, 0, 0, 47, 50, 1, 0, 0, 0, 48, 46,
    1, 0, 0, 0, 48, 49, 1, 0, 0, 0, 49, 51, 1, 0, 0, 0, 50, 48, 1, 0, 0, 0, 51,
    55, 5, 7, 0, 0, 52, 54, 5, 18, 0, 0, 53, 52, 1, 0, 0, 0, 54, 57, 1, 0, 0, 0,
    55, 53, 1, 0, 0, 0, 55, 56, 1, 0, 0, 0, 56, 58, 1, 0, 0, 0, 57, 55, 1, 0, 0,
    0, 58, 59, 3, 20, 10, 0, 59, 3, 1, 0, 0, 0, 60, 80, 3, 0, 0, 0, 61, 63, 5,
    18, 0, 0, 62, 61, 1, 0, 0, 0, 63, 64, 1, 0, 0, 0, 64, 62, 1, 0, 0, 0, 64,
    65, 1, 0, 0, 0, 65, 74, 1, 0, 0, 0, 66, 68, 3, 8, 4, 0, 67, 69, 5, 18, 0, 0,
    68, 67, 1, 0, 0, 0, 69, 70, 1, 0, 0, 0, 70, 68, 1, 0, 0, 0, 70, 71, 1, 0, 0,
    0, 71, 73, 1, 0, 0, 0, 72, 66, 1, 0, 0, 0, 73, 76, 1, 0, 0, 0, 74, 72, 1, 0,
    0, 0, 74, 75, 1, 0, 0, 0, 75, 77, 1, 0, 0, 0, 76, 74, 1, 0, 0, 0, 77, 79, 3,
    0, 0, 0, 78, 62, 1, 0, 0, 0, 79, 82, 1, 0, 0, 0, 80, 78, 1, 0, 0, 0, 80, 81,
    1, 0, 0, 0, 81, 91, 1, 0, 0, 0, 82, 80, 1, 0, 0, 0, 83, 85, 5, 18, 0, 0, 84,
    83, 1, 0, 0, 0, 85, 86, 1, 0, 0, 0, 86, 84, 1, 0, 0, 0, 86, 87, 1, 0, 0, 0,
    87, 88, 1, 0, 0, 0, 88, 90, 3, 2, 1, 0, 89, 84, 1, 0, 0, 0, 90, 93, 1, 0, 0,
    0, 91, 89, 1, 0, 0, 0, 91, 92, 1, 0, 0, 0, 92, 97, 1, 0, 0, 0, 93, 91, 1, 0,
    0, 0, 94, 96, 5, 18, 0, 0, 95, 94, 1, 0, 0, 0, 96, 99, 1, 0, 0, 0, 97, 95,
    1, 0, 0, 0, 97, 98, 1, 0, 0, 0, 98, 5, 1, 0, 0, 0, 99, 97, 1, 0, 0, 0, 100,
    101, 7, 0, 0, 0, 101, 7, 1, 0, 0, 0, 102, 109, 5, 14, 0, 0, 103, 109, 5, 15,
    0, 0, 104, 109, 5, 16, 0, 0, 105, 109, 3, 10, 5, 0, 106, 109, 3, 12, 6, 0,
    107, 109, 3, 14, 7, 0, 108, 102, 1, 0, 0, 0, 108, 103, 1, 0, 0, 0, 108, 104,
    1, 0, 0, 0, 108, 105, 1, 0, 0, 0, 108, 106, 1, 0, 0, 0, 108, 107, 1, 0, 0,
    0, 109, 9, 1, 0, 0, 0, 110, 111, 5, 1, 0, 0, 111, 11, 1, 0, 0, 0, 112, 113,
    5, 2, 0, 0, 113, 13, 1, 0, 0, 0, 114, 115, 5, 3, 0, 0, 115, 15, 1, 0, 0, 0,
    116, 117, 5, 17, 0, 0, 117, 17, 1, 0, 0, 0, 118, 119, 5, 4, 0, 0, 119, 19,
    1, 0, 0, 0, 120, 125, 5, 17, 0, 0, 121, 122, 5, 13, 0, 0, 122, 124, 5, 17,
    0, 0, 123, 121, 1, 0, 0, 0, 124, 127, 1, 0, 0, 0, 125, 123, 1, 0, 0, 0, 125,
    126, 1, 0, 0, 0, 126, 21, 1, 0, 0, 0, 127, 125, 1, 0, 0, 0, 14, 26, 33, 42,
    48, 55, 64, 70, 74, 80, 86, 91, 97, 108, 125,
  ];

  private static __ATN: ATN;
  public static get _ATN(): ATN {
    if (!OQLParser.__ATN) {
      OQLParser.__ATN = new ATNDeserializer().deserialize(
        OQLParser._serializedATN,
      );
    }

    return OQLParser.__ATN;
  }

  static DecisionsToDFA = OQLParser._ATN.decisionToState.map(
    (ds: DecisionState, index: number) => new DFA(ds, index),
  );
}

export class AtomContext extends ParserRuleContext {
  constructor(
    parser?: OQLParser,
    parent?: ParserRuleContext,
    invokingState?: number,
  ) {
    super(parent, invokingState);
    this.parser = parser;
  }
  public field(): FieldContext {
    return this.getTypedRuleContext(FieldContext, 0) as FieldContext;
  }
  public relop(): RelopContext {
    return this.getTypedRuleContext(RelopContext, 0) as RelopContext;
  }
  public value(): ValueContext {
    return this.getTypedRuleContext(ValueContext, 0) as ValueContext;
  }
  public SPACE_list(): TerminalNode[] {
    return this.getTokens(OQLParser.SPACE);
  }
  public SPACE(i: number): TerminalNode {
    return this.getToken(OQLParser.SPACE, i);
  }
  public LPAREN(): TerminalNode {
    return this.getToken(OQLParser.LPAREN, 0);
  }
  public expression(): ExpressionContext {
    return this.getTypedRuleContext(ExpressionContext, 0) as ExpressionContext;
  }
  public RPAREN(): TerminalNode {
    return this.getToken(OQLParser.RPAREN, 0);
  }
  public get ruleIndex(): number {
    return OQLParser.RULE_atom;
  }
  public enterRule(listener: OQLListener): void {
    if (listener.enterAtom) {
      listener.enterAtom(this);
    }
  }
  public exitRule(listener: OQLListener): void {
    if (listener.exitAtom) {
      listener.exitAtom(this);
    }
  }
}

export class SortAtomContext extends ParserRuleContext {
  constructor(
    parser?: OQLParser,
    parent?: ParserRuleContext,
    invokingState?: number,
  ) {
    super(parent, invokingState);
    this.parser = parser;
  }
  public sort(): SortContext {
    return this.getTypedRuleContext(SortContext, 0) as SortContext;
  }
  public EQ(): TerminalNode {
    return this.getToken(OQLParser.EQ, 0);
  }
  public value(): ValueContext {
    return this.getTypedRuleContext(ValueContext, 0) as ValueContext;
  }
  public SPACE_list(): TerminalNode[] {
    return this.getTokens(OQLParser.SPACE);
  }
  public SPACE(i: number): TerminalNode {
    return this.getToken(OQLParser.SPACE, i);
  }
  public get ruleIndex(): number {
    return OQLParser.RULE_sortAtom;
  }
  public enterRule(listener: OQLListener): void {
    if (listener.enterSortAtom) {
      listener.enterSortAtom(this);
    }
  }
  public exitRule(listener: OQLListener): void {
    if (listener.exitSortAtom) {
      listener.exitSortAtom(this);
    }
  }
}

export class ExpressionContext extends ParserRuleContext {
  constructor(
    parser?: OQLParser,
    parent?: ParserRuleContext,
    invokingState?: number,
  ) {
    super(parent, invokingState);
    this.parser = parser;
  }
  public atom_list(): AtomContext[] {
    return this.getTypedRuleContexts(AtomContext) as AtomContext[];
  }
  public atom(i: number): AtomContext {
    return this.getTypedRuleContext(AtomContext, i) as AtomContext;
  }
  public sortAtom_list(): SortAtomContext[] {
    return this.getTypedRuleContexts(SortAtomContext) as SortAtomContext[];
  }
  public sortAtom(i: number): SortAtomContext {
    return this.getTypedRuleContext(SortAtomContext, i) as SortAtomContext;
  }
  public SPACE_list(): TerminalNode[] {
    return this.getTokens(OQLParser.SPACE);
  }
  public SPACE(i: number): TerminalNode {
    return this.getToken(OQLParser.SPACE, i);
  }
  public logic_list(): LogicContext[] {
    return this.getTypedRuleContexts(LogicContext) as LogicContext[];
  }
  public logic(i: number): LogicContext {
    return this.getTypedRuleContext(LogicContext, i) as LogicContext;
  }
  public get ruleIndex(): number {
    return OQLParser.RULE_expression;
  }
  public enterRule(listener: OQLListener): void {
    if (listener.enterExpression) {
      listener.enterExpression(this);
    }
  }
  public exitRule(listener: OQLListener): void {
    if (listener.exitExpression) {
      listener.exitExpression(this);
    }
  }
}

export class RelopContext extends ParserRuleContext {
  constructor(
    parser?: OQLParser,
    parent?: ParserRuleContext,
    invokingState?: number,
  ) {
    super(parent, invokingState);
    this.parser = parser;
  }
  public EQ(): TerminalNode {
    return this.getToken(OQLParser.EQ, 0);
  }
  public NEQ(): TerminalNode {
    return this.getToken(OQLParser.NEQ, 0);
  }
  public GT(): TerminalNode {
    return this.getToken(OQLParser.GT, 0);
  }
  public LT(): TerminalNode {
    return this.getToken(OQLParser.LT, 0);
  }
  public LTE(): TerminalNode {
    return this.getToken(OQLParser.LTE, 0);
  }
  public GTE(): TerminalNode {
    return this.getToken(OQLParser.GTE, 0);
  }
  public get ruleIndex(): number {
    return OQLParser.RULE_relop;
  }
  public enterRule(listener: OQLListener): void {
    if (listener.enterRelop) {
      listener.enterRelop(this);
    }
  }
  public exitRule(listener: OQLListener): void {
    if (listener.exitRelop) {
      listener.exitRelop(this);
    }
  }
}

export class LogicContext extends ParserRuleContext {
  constructor(
    parser?: OQLParser,
    parent?: ParserRuleContext,
    invokingState?: number,
  ) {
    super(parent, invokingState);
    this.parser = parser;
  }
  public AND(): TerminalNode {
    return this.getToken(OQLParser.AND, 0);
  }
  public OR(): TerminalNode {
    return this.getToken(OQLParser.OR, 0);
  }
  public NOR(): TerminalNode {
    return this.getToken(OQLParser.NOR, 0);
  }
  public and(): AndContext {
    return this.getTypedRuleContext(AndContext, 0) as AndContext;
  }
  public or(): OrContext {
    return this.getTypedRuleContext(OrContext, 0) as OrContext;
  }
  public nor(): NorContext {
    return this.getTypedRuleContext(NorContext, 0) as NorContext;
  }
  public get ruleIndex(): number {
    return OQLParser.RULE_logic;
  }
  public enterRule(listener: OQLListener): void {
    if (listener.enterLogic) {
      listener.enterLogic(this);
    }
  }
  public exitRule(listener: OQLListener): void {
    if (listener.exitLogic) {
      listener.exitLogic(this);
    }
  }
}

export class AndContext extends ParserRuleContext {
  constructor(
    parser?: OQLParser,
    parent?: ParserRuleContext,
    invokingState?: number,
  ) {
    super(parent, invokingState);
    this.parser = parser;
  }
  public get ruleIndex(): number {
    return OQLParser.RULE_and;
  }
  public enterRule(listener: OQLListener): void {
    if (listener.enterAnd) {
      listener.enterAnd(this);
    }
  }
  public exitRule(listener: OQLListener): void {
    if (listener.exitAnd) {
      listener.exitAnd(this);
    }
  }
}

export class OrContext extends ParserRuleContext {
  constructor(
    parser?: OQLParser,
    parent?: ParserRuleContext,
    invokingState?: number,
  ) {
    super(parent, invokingState);
    this.parser = parser;
  }
  public get ruleIndex(): number {
    return OQLParser.RULE_or;
  }
  public enterRule(listener: OQLListener): void {
    if (listener.enterOr) {
      listener.enterOr(this);
    }
  }
  public exitRule(listener: OQLListener): void {
    if (listener.exitOr) {
      listener.exitOr(this);
    }
  }
}

export class NorContext extends ParserRuleContext {
  constructor(
    parser?: OQLParser,
    parent?: ParserRuleContext,
    invokingState?: number,
  ) {
    super(parent, invokingState);
    this.parser = parser;
  }
  public get ruleIndex(): number {
    return OQLParser.RULE_nor;
  }
  public enterRule(listener: OQLListener): void {
    if (listener.enterNor) {
      listener.enterNor(this);
    }
  }
  public exitRule(listener: OQLListener): void {
    if (listener.exitNor) {
      listener.exitNor(this);
    }
  }
}

export class FieldContext extends ParserRuleContext {
  constructor(
    parser?: OQLParser,
    parent?: ParserRuleContext,
    invokingState?: number,
  ) {
    super(parent, invokingState);
    this.parser = parser;
  }
  public STRING(): TerminalNode {
    return this.getToken(OQLParser.STRING, 0);
  }
  public get ruleIndex(): number {
    return OQLParser.RULE_field;
  }
  public enterRule(listener: OQLListener): void {
    if (listener.enterField) {
      listener.enterField(this);
    }
  }
  public exitRule(listener: OQLListener): void {
    if (listener.exitField) {
      listener.exitField(this);
    }
  }
}

export class SortContext extends ParserRuleContext {
  constructor(
    parser?: OQLParser,
    parent?: ParserRuleContext,
    invokingState?: number,
  ) {
    super(parent, invokingState);
    this.parser = parser;
  }
  public get ruleIndex(): number {
    return OQLParser.RULE_sort;
  }
  public enterRule(listener: OQLListener): void {
    if (listener.enterSort) {
      listener.enterSort(this);
    }
  }
  public exitRule(listener: OQLListener): void {
    if (listener.exitSort) {
      listener.exitSort(this);
    }
  }
}

export class ValueContext extends ParserRuleContext {
  constructor(
    parser?: OQLParser,
    parent?: ParserRuleContext,
    invokingState?: number,
  ) {
    super(parent, invokingState);
    this.parser = parser;
  }
  public STRING_list(): TerminalNode[] {
    return this.getTokens(OQLParser.STRING);
  }
  public STRING(i: number): TerminalNode {
    return this.getToken(OQLParser.STRING, i);
  }
  public COMMA_list(): TerminalNode[] {
    return this.getTokens(OQLParser.COMMA);
  }
  public COMMA(i: number): TerminalNode {
    return this.getToken(OQLParser.COMMA, i);
  }
  public get ruleIndex(): number {
    return OQLParser.RULE_value;
  }
  public enterRule(listener: OQLListener): void {
    if (listener.enterValue) {
      listener.enterValue(this);
    }
  }
  public exitRule(listener: OQLListener): void {
    if (listener.exitValue) {
      listener.exitValue(this);
    }
  }
}
