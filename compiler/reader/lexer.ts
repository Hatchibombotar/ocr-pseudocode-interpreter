import { error } from "../errors"

export enum TokenType {
    Null,
    Integer,
    Float,
    Identifier,
    String,

    OpenParen,
    CloseParen,
    CloseSquare,
    OpenSquare,
    Equals,
    BinaryOperator,
    Comma,
    Dot,
    Colon,

    Function,
    EndFunction,
    Return,

    Procedure,
    EndProcedure,

    If,
    ElseIf,
    Else,
    EndIf,
    Then,
    Switch,
    EndSwitch,
    Case,
    Default,

    Class,
    EndClass,
    Private,
    Public,
    New,
    Inherits,

    For,
    To,
    Next,
    While,
    EndWhile,
    Do,
    Until,

    Let,
    Array,

    NL,
    EOF,
}

const KEYWORDS: Record<string, TokenType> = {
    "let": TokenType.Let,
    "array": TokenType.Array,
    "null": TokenType.Null,
    "MOD": TokenType.BinaryOperator,
    "DIV": TokenType.BinaryOperator,
    "AND": TokenType.BinaryOperator,
    "OR": TokenType.BinaryOperator,
    "function": TokenType.Function,
    "endfunction": TokenType.EndFunction,
    "return": TokenType.Return,
    "if": TokenType.If,
    "elseif": TokenType.ElseIf,
    "else": TokenType.Else,
    "endif": TokenType.EndIf,
    "procedure": TokenType.Procedure,
    "endprocedure": TokenType.EndProcedure,
    "for": TokenType.For,
    "to": TokenType.To,
    "next": TokenType.Next,
    "while": TokenType.While,
    "endwhile": TokenType.EndWhile,
    "do": TokenType.Do,
    "until": TokenType.Until,
    "NOT": TokenType.BinaryOperator,
    "switch": TokenType.Switch,
    "endswitch": TokenType.EndSwitch,
    "case": TokenType.Case,
    "default": TokenType.Default,
    "class": TokenType.Class,
    "endclass": TokenType.EndClass,
    "public": TokenType.Public,
    "private": TokenType.Private,
    "new": TokenType.New,
    "inherits": TokenType.Inherits
}

export interface Token {
    value: string,
    type: TokenType,
    meta: TokenMetadata
}

type TokenMetadata = {
    line: number,
    column: number
}

function token(value = "", type: TokenType, meta: TokenMetadata): Token {
    return {
        value,
        type,
        meta
    }
}

function is_skippable(str: string) {
    return str == " " || str == "\n" || str == "\t" || str == "\r"
}

export function tokenise(source: string): Token[] {
    const tokens: Token[] = []
    const src = source.split("")

    let line = 1
    let column = 0

    const shift = () => {
        column += 1
        return src.shift()
    }

    while (src.length > 0) {
        const meta = {line, column}
        if (src.at(0) == "/" && src.at(1) == "/") {
            while (src.length > 0 && src.at(0) != "\n") {
                shift()
            }
        } else if (src[0] == "(") {
            tokens.push(token(shift(), TokenType.OpenParen, meta))
        } else if (src[0] == ")") {
            tokens.push(token(shift(), TokenType.CloseParen, meta))
        } else if (src[0] == "[") {
            tokens.push(token(shift(), TokenType.OpenSquare, meta))
        } else if (src[0] == "]") {
            tokens.push(token(shift(), TokenType.CloseSquare, meta))
        } else if (src[0] == ",") {
            tokens.push(token(shift(), TokenType.Comma, meta))
        } else if (src[0] == "=" && src[1] == "=") { // ==
            shift()
            shift()
            tokens.push(token("==", TokenType.BinaryOperator, meta))
        } else if (src[0] == "!" && src[1] == "=") { // !=
            shift()
            shift()
            tokens.push(token("!=", TokenType.BinaryOperator, meta))
        } else if (src[0] == ">" && src[1] == "=") { // >=
            shift()
            shift()
            tokens.push(token(">=", TokenType.BinaryOperator, meta))
        } else if (src[0] == "<" && src[1] == "=") { // <=
            shift()
            shift()
            tokens.push(token("<=", TokenType.BinaryOperator, meta))
        } else if (["+", "-", "*", "/", "^", ">", "<", "!"].includes(src[0])) {
            tokens.push(token(shift(), TokenType.BinaryOperator, meta))
        } else if (src[0] == "=") {
            tokens.push(token(shift(), TokenType.Equals, meta))
        } else if (src[0] == ".") {
            tokens.push(token(shift(), TokenType.Dot, meta))
        } else if (src[0] == ":") {
            tokens.push(token(shift(), TokenType.Colon, meta))
        } else if (src[0] == "\"") {
            let str = ""
            shift()
            while (src.length > 0) {
                if (src[0] == "\"") break
                str += shift()
            }
            shift()
            tokens.push(token(str, TokenType.String, meta))
        } else {
            if (src[0].match(/[0-9]/)) {
                let num = ""
                let float = false
                while (src.length > 0 && src[0].match(/[0-9._]/)) {
                    const char = shift()
                    if (char == ".") {
                        if (float) {
                            error("syntax", "You can only have one decimal point in a number.")
                        }
                        float = true
                    }
                    if (char == "_") {
                        continue
                    }
                    num += char
                }
                tokens.push(token(num, float ? TokenType.Float : TokenType.Integer, meta))
            } else if (src[0].match(/[a-zA-Z\_\-]/)) {
                let identifier = ""
                while (src.length > 0 && src[0].match(/[a-zA-Z0-9\_\-]/)) {
                    identifier += shift()
                }

                const reserved: TokenType = KEYWORDS[identifier]
                if (reserved !== undefined && tokens.at(-1)?.type != TokenType.Dot) {
                    tokens.push(token(identifier, reserved, meta))
                } else {
                    tokens.push(token(identifier, TokenType.Identifier, meta))
                }
            } else if (src[0] == "\n") {
                line += 1
                column = 0
                shift()
            } else if (is_skippable(src[0])) {
                shift()
            } else {
                error("syntax", `Unrecognised character(${src[0].charCodeAt(0)}): ${src[0]}`)
            }

        }
    }

    tokens.push({ type: TokenType.EOF, value: "EndOfFile", meta: {line, column} })

    return tokens
}