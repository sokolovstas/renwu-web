// Generated from libs/core/src/lib/search/oql/OQL.g4 by ANTLR 4.13.1

import { ParseTreeListener } from 'antlr4';

import { AtomContext } from './OQLParser';
import { SortAtomContext } from './OQLParser';
import { ExpressionContext } from './OQLParser';
import { RelopContext } from './OQLParser';
import { LogicContext } from './OQLParser';
import { AndContext } from './OQLParser';
import { OrContext } from './OQLParser';
import { NorContext } from './OQLParser';
import { FieldContext } from './OQLParser';
import { SortContext } from './OQLParser';
import { ValueContext } from './OQLParser';

/**
 * This interface defines a complete listener for a parse tree produced by
 * `OQLParser`.
 */
export default class OQLListener extends ParseTreeListener {
  /**
   * Enter a parse tree produced by `OQLParser.atom`.
   * @param ctx the parse tree
   */
  enterAtom?: (ctx: AtomContext) => void;
  /**
   * Exit a parse tree produced by `OQLParser.atom`.
   * @param ctx the parse tree
   */
  exitAtom?: (ctx: AtomContext) => void;
  /**
   * Enter a parse tree produced by `OQLParser.sortAtom`.
   * @param ctx the parse tree
   */
  enterSortAtom?: (ctx: SortAtomContext) => void;
  /**
   * Exit a parse tree produced by `OQLParser.sortAtom`.
   * @param ctx the parse tree
   */
  exitSortAtom?: (ctx: SortAtomContext) => void;
  /**
   * Enter a parse tree produced by `OQLParser.expression`.
   * @param ctx the parse tree
   */
  enterExpression?: (ctx: ExpressionContext) => void;
  /**
   * Exit a parse tree produced by `OQLParser.expression`.
   * @param ctx the parse tree
   */
  exitExpression?: (ctx: ExpressionContext) => void;
  /**
   * Enter a parse tree produced by `OQLParser.relop`.
   * @param ctx the parse tree
   */
  enterRelop?: (ctx: RelopContext) => void;
  /**
   * Exit a parse tree produced by `OQLParser.relop`.
   * @param ctx the parse tree
   */
  exitRelop?: (ctx: RelopContext) => void;
  /**
   * Enter a parse tree produced by `OQLParser.logic`.
   * @param ctx the parse tree
   */
  enterLogic?: (ctx: LogicContext) => void;
  /**
   * Exit a parse tree produced by `OQLParser.logic`.
   * @param ctx the parse tree
   */
  exitLogic?: (ctx: LogicContext) => void;
  /**
   * Enter a parse tree produced by `OQLParser.and`.
   * @param ctx the parse tree
   */
  enterAnd?: (ctx: AndContext) => void;
  /**
   * Exit a parse tree produced by `OQLParser.and`.
   * @param ctx the parse tree
   */
  exitAnd?: (ctx: AndContext) => void;
  /**
   * Enter a parse tree produced by `OQLParser.or`.
   * @param ctx the parse tree
   */
  enterOr?: (ctx: OrContext) => void;
  /**
   * Exit a parse tree produced by `OQLParser.or`.
   * @param ctx the parse tree
   */
  exitOr?: (ctx: OrContext) => void;
  /**
   * Enter a parse tree produced by `OQLParser.nor`.
   * @param ctx the parse tree
   */
  enterNor?: (ctx: NorContext) => void;
  /**
   * Exit a parse tree produced by `OQLParser.nor`.
   * @param ctx the parse tree
   */
  exitNor?: (ctx: NorContext) => void;
  /**
   * Enter a parse tree produced by `OQLParser.field`.
   * @param ctx the parse tree
   */
  enterField?: (ctx: FieldContext) => void;
  /**
   * Exit a parse tree produced by `OQLParser.field`.
   * @param ctx the parse tree
   */
  exitField?: (ctx: FieldContext) => void;
  /**
   * Enter a parse tree produced by `OQLParser.sort`.
   * @param ctx the parse tree
   */
  enterSort?: (ctx: SortContext) => void;
  /**
   * Exit a parse tree produced by `OQLParser.sort`.
   * @param ctx the parse tree
   */
  exitSort?: (ctx: SortContext) => void;
  /**
   * Enter a parse tree produced by `OQLParser.value`.
   * @param ctx the parse tree
   */
  enterValue?: (ctx: ValueContext) => void;
  /**
   * Exit a parse tree produced by `OQLParser.value`.
   * @param ctx the parse tree
   */
  exitValue?: (ctx: ValueContext) => void;
}
