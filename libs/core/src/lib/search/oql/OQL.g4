grammar OQL;

atom
   : field SPACE* relop SPACE* value
   | LPAREN expression RPAREN
   ;

sortAtom
   : sort SPACE* EQ SPACE* value 
   ;

expression
   : atom (SPACE+(logic SPACE+)* atom)* (SPACE+ sortAtom)* SPACE*
   ;

relop
   : EQ
   | NEQ
   | GT
   | LT
   | LTE
   | GTE
   ;

logic
   : AND
   | OR
   | NOR
   | and
   | or
   | nor
   ;

LPAREN
   : '('
   ;


RPAREN
   : ')'
   ;

EQ
   : '='
   ;

GT
   : '>'
   ;


LT
   : '<'
   ;


NEQ
   : '!='
   ;


GTE
   : '>='
   ;


LTE
   : '<='
   ;


COMMA
   : ','
   ;

AND
   : 'AND'
   ;

OR
   : 'OR'
   ;

NOR
   : 'NOR'
   ;

and
   : 'and'
   ;

or
   : 'or'
   ;

nor
   : 'nor'
   ;

field
   : STRING
   ;

sort
   : 'sort'
   ;

value
   : STRING(','STRING)*
   ;

STRING
   : ['] (~['] | '\'\'')* [']
   | ["] (~["] | '""')* ["]
   | NO_SPACE+
   ;

fragment
NO_SPACE : ~[ '"=<>!,];

SPACE : ' ';

NEWLINE
   : [\t\r\n\u000C]+ -> skip
   ;

