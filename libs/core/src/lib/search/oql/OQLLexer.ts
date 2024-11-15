// Generated from libs/core/src/lib/search/oql/OQL.g4 by ANTLR 4.13.1
// noinspection ES6UnusedImports,JSUnusedGlobalSymbols,JSUnusedLocalSymbols
import {
  ATN,
  ATNDeserializer,
  CharStream,
  DecisionState,
  DFA,
  Lexer,
  LexerATNSimulator,
  RuleContext,
  PredictionContextCache,
  Token,
} from 'antlr4';
export default class OQLLexer extends Lexer {
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
  public static readonly EOF = Token.EOF;

  public static readonly channelNames: string[] = [
    'DEFAULT_TOKEN_CHANNEL',
    'HIDDEN',
  ];
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
  public static readonly modeNames: string[] = ['DEFAULT_MODE'];

  public static readonly ruleNames: string[] = [
    'T__0',
    'T__1',
    'T__2',
    'T__3',
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
    'NO_SPACE',
    'SPACE',
    'NEWLINE',
  ];

  constructor(input: CharStream) {
    super(input);
    this._interp = new LexerATNSimulator(
      this,
      OQLLexer._ATN,
      OQLLexer.DecisionsToDFA,
      new PredictionContextCache(),
    );
  }

  public get grammarFileName(): string {
    return 'OQL.g4';
  }

  public get literalNames(): (string | null)[] {
    return OQLLexer.literalNames;
  }
  public get symbolicNames(): (string | null)[] {
    return OQLLexer.symbolicNames;
  }
  public get ruleNames(): string[] {
    return OQLLexer.ruleNames;
  }

  public get serializedATN(): number[] {
    return OQLLexer._serializedATN;
  }

  public get channelNames(): string[] {
    return OQLLexer.channelNames;
  }

  public get modeNames(): string[] {
    return OQLLexer.modeNames;
  }

  public static readonly _serializedATN: number[] = [
    4, 0, 19, 127, 6, -1, 2, 0, 7, 0, 2, 1, 7, 1, 2, 2, 7, 2, 2, 3, 7, 3, 2, 4,
    7, 4, 2, 5, 7, 5, 2, 6, 7, 6, 2, 7, 7, 7, 2, 8, 7, 8, 2, 9, 7, 9, 2, 10, 7,
    10, 2, 11, 7, 11, 2, 12, 7, 12, 2, 13, 7, 13, 2, 14, 7, 14, 2, 15, 7, 15, 2,
    16, 7, 16, 2, 17, 7, 17, 2, 18, 7, 18, 2, 19, 7, 19, 1, 0, 1, 0, 1, 0, 1, 0,
    1, 1, 1, 1, 1, 1, 1, 2, 1, 2, 1, 2, 1, 2, 1, 3, 1, 3, 1, 3, 1, 3, 1, 3, 1,
    4, 1, 4, 1, 5, 1, 5, 1, 6, 1, 6, 1, 7, 1, 7, 1, 8, 1, 8, 1, 9, 1, 9, 1, 9,
    1, 10, 1, 10, 1, 10, 1, 11, 1, 11, 1, 11, 1, 12, 1, 12, 1, 13, 1, 13, 1, 13,
    1, 13, 1, 14, 1, 14, 1, 14, 1, 15, 1, 15, 1, 15, 1, 15, 1, 16, 1, 16, 1, 16,
    1, 16, 5, 16, 94, 8, 16, 10, 16, 12, 16, 97, 9, 16, 1, 16, 1, 16, 1, 16, 1,
    16, 1, 16, 5, 16, 104, 8, 16, 10, 16, 12, 16, 107, 9, 16, 1, 16, 1, 16, 4,
    16, 111, 8, 16, 11, 16, 12, 16, 112, 3, 16, 115, 8, 16, 1, 17, 1, 17, 1, 18,
    1, 18, 1, 19, 4, 19, 122, 8, 19, 11, 19, 12, 19, 123, 1, 19, 1, 19, 0, 0,
    20, 1, 1, 3, 2, 5, 3, 7, 4, 9, 5, 11, 6, 13, 7, 15, 8, 17, 9, 19, 10, 21,
    11, 23, 12, 25, 13, 27, 14, 29, 15, 31, 16, 33, 17, 35, 0, 37, 18, 39, 19,
    1, 0, 4, 1, 0, 39, 39, 1, 0, 34, 34, 4, 0, 32, 34, 39, 39, 44, 44, 60, 62,
    2, 0, 9, 10, 12, 13, 133, 0, 1, 1, 0, 0, 0, 0, 3, 1, 0, 0, 0, 0, 5, 1, 0, 0,
    0, 0, 7, 1, 0, 0, 0, 0, 9, 1, 0, 0, 0, 0, 11, 1, 0, 0, 0, 0, 13, 1, 0, 0, 0,
    0, 15, 1, 0, 0, 0, 0, 17, 1, 0, 0, 0, 0, 19, 1, 0, 0, 0, 0, 21, 1, 0, 0, 0,
    0, 23, 1, 0, 0, 0, 0, 25, 1, 0, 0, 0, 0, 27, 1, 0, 0, 0, 0, 29, 1, 0, 0, 0,
    0, 31, 1, 0, 0, 0, 0, 33, 1, 0, 0, 0, 0, 37, 1, 0, 0, 0, 0, 39, 1, 0, 0, 0,
    1, 41, 1, 0, 0, 0, 3, 45, 1, 0, 0, 0, 5, 48, 1, 0, 0, 0, 7, 52, 1, 0, 0, 0,
    9, 57, 1, 0, 0, 0, 11, 59, 1, 0, 0, 0, 13, 61, 1, 0, 0, 0, 15, 63, 1, 0, 0,
    0, 17, 65, 1, 0, 0, 0, 19, 67, 1, 0, 0, 0, 21, 70, 1, 0, 0, 0, 23, 73, 1, 0,
    0, 0, 25, 76, 1, 0, 0, 0, 27, 78, 1, 0, 0, 0, 29, 82, 1, 0, 0, 0, 31, 85, 1,
    0, 0, 0, 33, 114, 1, 0, 0, 0, 35, 116, 1, 0, 0, 0, 37, 118, 1, 0, 0, 0, 39,
    121, 1, 0, 0, 0, 41, 42, 5, 97, 0, 0, 42, 43, 5, 110, 0, 0, 43, 44, 5, 100,
    0, 0, 44, 2, 1, 0, 0, 0, 45, 46, 5, 111, 0, 0, 46, 47, 5, 114, 0, 0, 47, 4,
    1, 0, 0, 0, 48, 49, 5, 110, 0, 0, 49, 50, 5, 111, 0, 0, 50, 51, 5, 114, 0,
    0, 51, 6, 1, 0, 0, 0, 52, 53, 5, 115, 0, 0, 53, 54, 5, 111, 0, 0, 54, 55, 5,
    114, 0, 0, 55, 56, 5, 116, 0, 0, 56, 8, 1, 0, 0, 0, 57, 58, 5, 40, 0, 0, 58,
    10, 1, 0, 0, 0, 59, 60, 5, 41, 0, 0, 60, 12, 1, 0, 0, 0, 61, 62, 5, 61, 0,
    0, 62, 14, 1, 0, 0, 0, 63, 64, 5, 62, 0, 0, 64, 16, 1, 0, 0, 0, 65, 66, 5,
    60, 0, 0, 66, 18, 1, 0, 0, 0, 67, 68, 5, 33, 0, 0, 68, 69, 5, 61, 0, 0, 69,
    20, 1, 0, 0, 0, 70, 71, 5, 62, 0, 0, 71, 72, 5, 61, 0, 0, 72, 22, 1, 0, 0,
    0, 73, 74, 5, 60, 0, 0, 74, 75, 5, 61, 0, 0, 75, 24, 1, 0, 0, 0, 76, 77, 5,
    44, 0, 0, 77, 26, 1, 0, 0, 0, 78, 79, 5, 65, 0, 0, 79, 80, 5, 78, 0, 0, 80,
    81, 5, 68, 0, 0, 81, 28, 1, 0, 0, 0, 82, 83, 5, 79, 0, 0, 83, 84, 5, 82, 0,
    0, 84, 30, 1, 0, 0, 0, 85, 86, 5, 78, 0, 0, 86, 87, 5, 79, 0, 0, 87, 88, 5,
    82, 0, 0, 88, 32, 1, 0, 0, 0, 89, 95, 7, 0, 0, 0, 90, 94, 8, 0, 0, 0, 91,
    92, 5, 39, 0, 0, 92, 94, 5, 39, 0, 0, 93, 90, 1, 0, 0, 0, 93, 91, 1, 0, 0,
    0, 94, 97, 1, 0, 0, 0, 95, 93, 1, 0, 0, 0, 95, 96, 1, 0, 0, 0, 96, 98, 1, 0,
    0, 0, 97, 95, 1, 0, 0, 0, 98, 115, 7, 0, 0, 0, 99, 105, 7, 1, 0, 0, 100,
    104, 8, 1, 0, 0, 101, 102, 5, 34, 0, 0, 102, 104, 5, 34, 0, 0, 103, 100, 1,
    0, 0, 0, 103, 101, 1, 0, 0, 0, 104, 107, 1, 0, 0, 0, 105, 103, 1, 0, 0, 0,
    105, 106, 1, 0, 0, 0, 106, 108, 1, 0, 0, 0, 107, 105, 1, 0, 0, 0, 108, 115,
    7, 1, 0, 0, 109, 111, 3, 35, 17, 0, 110, 109, 1, 0, 0, 0, 111, 112, 1, 0, 0,
    0, 112, 110, 1, 0, 0, 0, 112, 113, 1, 0, 0, 0, 113, 115, 1, 0, 0, 0, 114,
    89, 1, 0, 0, 0, 114, 99, 1, 0, 0, 0, 114, 110, 1, 0, 0, 0, 115, 34, 1, 0, 0,
    0, 116, 117, 8, 2, 0, 0, 117, 36, 1, 0, 0, 0, 118, 119, 5, 32, 0, 0, 119,
    38, 1, 0, 0, 0, 120, 122, 7, 3, 0, 0, 121, 120, 1, 0, 0, 0, 122, 123, 1, 0,
    0, 0, 123, 121, 1, 0, 0, 0, 123, 124, 1, 0, 0, 0, 124, 125, 1, 0, 0, 0, 125,
    126, 6, 19, 0, 0, 126, 40, 1, 0, 0, 0, 8, 0, 93, 95, 103, 105, 112, 114,
    123, 1, 6, 0, 0,
  ];

  private static __ATN: ATN;
  public static get _ATN(): ATN {
    if (!OQLLexer.__ATN) {
      OQLLexer.__ATN = new ATNDeserializer().deserialize(
        OQLLexer._serializedATN,
      );
    }

    return OQLLexer.__ATN;
  }

  static DecisionsToDFA = OQLLexer._ATN.decisionToState.map(
    (ds: DecisionState, index: number) => new DFA(ds, index),
  );
}
