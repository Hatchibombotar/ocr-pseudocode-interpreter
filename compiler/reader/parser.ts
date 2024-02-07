import { error } from "../errors";
import { Statement, Program, Expression, BinaryExpression, NumericLiteral, Identifier, NullLiteral, VariableDeclaration, AssignmentExpression, ArrayDeclaration, CallExpression, MemberExpression, StringLiteral, FunctionDeclaration, IfStatement, ReturnStatement, ForLoop, WhileLoop, DoUntilLoop, UnaryExpression, CaseStatement, SwitchStatement, FloatLiteral, RangeExpression } from "./ast";
import { tokenise, Token, TokenType } from "./lexer";

export default function Parser(source_code: string): Program {
    let tokens: Token[] = []

    function at() {
        return tokens[0]
    }

    function eat() {
        const prev = tokens.shift() as Token
        return prev
    }

    function expect(type: TokenType, provided_error: any) {
        const previous = tokens.shift() as Token;
        if (!previous || previous.type != type) {
            error("syntax", provided_error + previous + " - Expecting: " + type);
        }

        return previous;
    }

    function not_eof() {
        return tokens[0].type != TokenType.EOF
    }

    function parse_statement(): Statement {
        switch (at().type) {
            case TokenType.Let:
                return parse_variable_declaration()
            case TokenType.Array:
                return parse_array_declaration()
            case TokenType.Procedure:
            case TokenType.Function:
                return parse_function_declaration()
            case TokenType.Return:
                return parse_return_statement()
            case TokenType.If:
                return parse_if_statement()
            case TokenType.Switch:
                return parse_switch_statement()
            case TokenType.For:
                return parse_for_statement()
            case TokenType.While:
                return parse_while_statement()
            case TokenType.Do:
                return parse_do_until_statement()
            default:
                return parse_expression()
        }
    }

    function parse_for_statement(): Statement {
        eat() // for
        const variable = expect(TokenType.Identifier, "Expected variable in for loop.").value
        eat() // =
        const initial_value = parse_multiplicative_expression() // skips assignment and range so the "to" does not make it get passes as a range
        // TODO: use ranges instead of parsing items individially?
        eat() // to
        const end_value = parse_expression()
        const body: Statement[] = []


        while (at().type != TokenType.EOF && at().type != TokenType.Next) {
            body.push(parse_statement())
        }

        eat() // next
        const loop_variable = expect(TokenType.Identifier, "Expected variable after next keyword in for loop.").value
        if (loop_variable != variable) {
            error("syntax", "The variable being increased in next _ must be the same as in the loop initialiser.")
        }


        return {
            kind: "ForLoop",
            variable,
            initial_value,
            end_value,
            body
        } as ForLoop
    }

    function parse_while_statement(): Statement {
        eat() // while
        const condition = parse_expression()
        const body: Statement[] = []


        while (at().type != TokenType.EOF && at().type != TokenType.EndWhile) {
            body.push(parse_statement())
        }

        eat() // endwhile

        return {
            kind: "WhileLoop",
            condition,
            body
        } as WhileLoop
    }

    function parse_do_until_statement(): Statement {
        eat() // do
        const body: Statement[] = []


        while (at().type != TokenType.EOF && at().type != TokenType.Until) {
            body.push(parse_statement())
        }

        eat() // until
        const condition = parse_expression()

        return {
            kind: "DoUntilLoop",
            condition,
            body
        } as DoUntilLoop
    }

    function parse_switch_statement(): Statement {
        eat() // switch
        const discriminant = parse_expression()
        expect(TokenType.Colon, "Expected colon following discriminant in switch/case statement")
        const cases: CaseStatement[] = []

        while (at().type != TokenType.EOF && at().type != TokenType.EndSwitch) {
            const initialiser = eat()
            if (initialiser.type != TokenType.Default && initialiser.type != TokenType.Case) {
                error("syntax", `Expected keyword "default" or "case" inside switch statement.`)
            }
            const test = initialiser.type == TokenType.Case ? parse_expression() : null
            expect(TokenType.Colon, "Expected colon following test in case statement")
            const then: Statement[] = []

            while (at().type != TokenType.EOF && at().type != TokenType.EndSwitch && at().type != TokenType.Case && at().type != TokenType.Default) {
                then.push(parse_statement())
            }

            cases.push({
                kind: "CaseStatement",
                test,
                then
            })
        }

        eat() // endswitch

        return {
            kind: "SwitchStatement",
            cases,
            discriminant
        } as SwitchStatement
    }

    function parse_if_statement(): Statement {
        eat() // if | elseif
        const condition = parse_expression()
        eat() // then
        const then: Statement[] = []

        while (at().type != TokenType.EOF && at().type != TokenType.EndIf && at().type != TokenType.Else && at().type != TokenType.ElseIf) {
            then.push(parse_statement())
        }

        if (at().type == TokenType.ElseIf) {
            const alternate = parse_if_statement()
            return {
                kind: "IfStatement",
                condition,
                then,
                else: [alternate],
            } as IfStatement
        } else if (at().type == TokenType.Else) {
            eat() // else
            const alternate: Statement[] = []

            while (at().type != TokenType.EOF && at().type != TokenType.EndIf) {
                alternate.push(parse_statement())
            }
            eat() // endif


            return {
                kind: "IfStatement",
                condition,
                then,
                else: alternate,
            } as IfStatement
        }

        eat() // endif

        return {
            kind: "IfStatement",
            condition,
            then,
            else: null,
        } as IfStatement
    }


    function parse_function_declaration(): Statement {
        const keyword = eat() // function | procedure
        const name = expect(TokenType.Identifier, `Expected identifier name following ${keyword.value} keyword.`).value

        const args = parse_arguments()
        const parameters: string[] = []
        for (const arg of args) {
            if (arg.kind != "Identifier") {
                error("syntax", "Only identifiers are supported as parameters.")
            }
            parameters.push((arg as Identifier).symbol)
        }

        // expect(TokenType.NL, "Expected newline after function declatation")

        const body: Statement[] = []

        const end_token = keyword.type == TokenType.Function ? TokenType.EndFunction : TokenType.EndProcedure
        const end_keyword = keyword.type == TokenType.Function ? "endfunction" : "endprocedure"

        while (at().type != TokenType.EOF && at().type != end_token) {
            body.push(parse_statement())
        }

        expect(end_token, `Expected ${end_keyword} keyword following ${keyword.value} body.`)

        const function_declaration = {
            kind: keyword.type == TokenType.Function ? "FunctionDeclaration" : "ProcedureDeclaration",
            identifier: name,
            parameters,
            body
        } as Statement

        return function_declaration
    }

    function parse_return_statement(): Statement {
        eat() // eat return
        const return_statement = {
            kind: "ReturnStatement",
            value: parse_expression()
        } as ReturnStatement

        return return_statement
    }

    function parse_array_declaration(): Statement {
        eat() // array
        const identifier = expect(TokenType.Identifier, "Expected identifier name after array keyword").value
        expect(TokenType.OpenSquare, "Expected '[' following identifer in array definition")

        const dimensions = []
        while (at().type != TokenType.EOF && at().type != TokenType.CloseSquare) {
            const dimension = parse_expression()
            dimensions.push(dimension)
            const next = at()

            if (next.type == TokenType.Comma) {
                eat()
                continue
            } else if (next.type == TokenType.CloseSquare) {
                break
            } else {
                error("syntax", `Unexpected token ${next.type} ${next.value} following array dimension.`)
            }
        }

        expect(TokenType.CloseSquare, "Expected ']' following array dimensions in array definition")

        return {
            identifier,
            kind: "ArrayDeclaration",
            dimensions
        } as ArrayDeclaration
    }

    function parse_variable_declaration(): Statement {
        eat()
        const identifier = expect(TokenType.Identifier, "Expected identifier name after let | const keyword").value
        expect(TokenType.Equals, "Expected = following identifer in assignment ")

        return {
            identifier,
            kind: "VariableDeclaration",
            value: parse_expression()
        } as VariableDeclaration
    }

    function parse_expression(): Expression {
        return parse_assignment_expression()
    }

    function parse_assignment_expression(): Expression {
        let left = parse_range_expression()

        while (at().type == TokenType.Equals) {
            eat()
            const value = parse_assignment_expression()
            left = {
                kind: "AssignmentExpression",
                assign_to: left,
                value
            } as AssignmentExpression
        }

        return left
    }

    function parse_range_expression(): Expression {
        let left = parse_multiplicative_expression()

        while (at().type == TokenType.To) {
            eat()

            const right = parse_multiplicative_expression()
            left = {
                kind: "RangeExpression",
                left,
                right
            } as RangeExpression
        }

        return left
    }

    function parse_multiplicative_expression(): Expression {
        let left = parse_additive_expression()

        while (at().value == "/" || at().value == "*" || at().value == "MOD" || at().value == "DIV") {
            const operator = eat().value
            const right = parse_additive_expression()
            left = {
                kind: "BinaryExpression",
                left,
                right,
                operator
            } as BinaryExpression
        }

        return left
    }


    function parse_additive_expression(): Expression {
        let left = parse_exponent_expression()

        while (at().value == "+" || at().value == "-") {
            const operator = eat().value
            const right = parse_exponent_expression()
            left = {
                kind: "BinaryExpression",
                left,
                right,
                operator
            } as BinaryExpression
        }

        return left
    }



    function parse_exponent_expression(): Expression {
        let left = parse_boolean_or_expression()

        while (at().value == "^") {
            const operator = eat().value
            const right = parse_boolean_or_expression()
            left = {
                kind: "BinaryExpression",
                left,
                right,
                operator
            } as BinaryExpression
        }

        return left
    }

    function parse_boolean_or_expression(): Expression {
        let left = parse_boolean_and_expression()

        while (at().value == "OR") {
            const operator = eat().value
            const right = parse_boolean_and_expression()
            left = {
                kind: "BinaryExpression",
                left,
                right,
                operator
            } as BinaryExpression
        }

        return left
    }

    function parse_boolean_and_expression(): Expression {
        let left = parse_comparison_expression()

        while (at().value == "AND") {
            const operator = eat().value
            const right = parse_comparison_expression()
            left = {
                kind: "BinaryExpression",
                left,
                right,
                operator
            } as BinaryExpression
        }

        return left
    }

    function parse_comparison_expression(): Expression {
        let left = parse_not_expression()

        while (["==", "!=", ">", "<", ">=", "<="].includes(at().value)) {
            const operator = eat().value
            const right = parse_not_expression()
            left = {
                kind: "BinaryExpression",
                left,
                right,
                operator
            } as BinaryExpression
        }

        return left
    }


    function parse_not_expression(): Expression {
        if (at().value == "NOT") {
            const operator = eat().value
            const right = parse_not_expression()
            return {
                kind: "UnaryExpression",
                right,
                operator
            } as UnaryExpression
        }
        return parse_positive_expression()
    }

    function parse_positive_expression(): Expression {
        if (at().value == "+") {
            const operator = eat().value
            const right = parse_positive_expression()
            return {
                kind: "UnaryExpression",
                right,
                operator
            } as UnaryExpression
        }
        return parse_negative_expression()
    }

    function parse_negative_expression(): Expression {
        if (at().value == "-") {
            const operator = eat().value
            const right = parse_positive_expression()
            return {
                kind: "UnaryExpression",
                right,
                operator
            } as UnaryExpression
        }
        return parse_member_call_expression()
    }

    // NOT is NOT a binary operator.

    // function parse_boolean_not_expression(): Expression {
    //     let left = parse_member_call_expression()

    //     while (at().value == "NOT") {
    //         const operator = eat().value
    //         const right = parse_member_call_expression()
    //         left = {
    //             kind: "BinaryExpression",
    //             left,
    //             right,
    //             operator
    //         } as BinaryExpression
    //     }

    //     return left
    // }


    function parse_member_call_expression(): Expression {
        const member = parse_member_expression()

        if (at().type == TokenType.OpenParen) {
            return parse_call_expression(member)
        }

        return member
    }

    function parse_call_expression(caller: Expression): Expression {
        let call_expression: Expression = {
            kind: "CallExpression",
            caller,
            arguments: parse_arguments()
        } as CallExpression

        if (at().type == TokenType.OpenParen) {
            call_expression = parse_call_expression(call_expression)
        }

        return call_expression
    }

    function parse_arguments(): Expression[] {
        expect(TokenType.OpenParen, "Expected open parenthesis")
        const argument_list = at().type == TokenType.CloseParen ? [] : parse_arguments_list()
        expect(TokenType.CloseParen, "Missing closing paren inside args list")

        return argument_list
    }

    function parse_arguments_list(): Expression[] {
        const argument_list = [parse_expression()]

        while (at().type == TokenType.Comma && eat()) {
            argument_list.push(parse_expression())
        }

        return argument_list
    }

    function parse_member_expression(): Expression {
        let object = parse_primary_expression()

        while (at().type == TokenType.OpenSquare || at().type == TokenType.Dot) {
            let property: Expression;

            if (at().type == TokenType.Dot) {
                eat()
                property = parse_primary_expression()
                if (property.kind != "Identifier") {
                    error("runtime", `Can not use dot operator without right hand side being an identifier`)
                }

                object = {
                    kind: "MemberExpression",
                    object,
                    property,
                    computed: false
                } as MemberExpression
            } else {
                eat() // open bracket

                while (at().type != TokenType.EOF) {
                    const property = parse_expression();
                    object = {
                        kind: "MemberExpression",
                        object,
                        property,
                        computed: true
                    } as MemberExpression

                    if (at().type == TokenType.Comma) {
                        eat()
                    } else if (at().type == TokenType.CloseSquare) {
                        eat()
                        break
                    }
                }
            }

        }

        return object
    }

    function parse_primary_expression(): Expression {
        const current_token = at().type

        switch (current_token) {
            case TokenType.Identifier:
                return { kind: "Identifier", symbol: eat().value } as Identifier
            case TokenType.Null:
                eat()
                return { kind: "NullLiteral", value: "null" } as NullLiteral
            case TokenType.Integer:
                return { kind: "NumericLiteral", value: parseFloat(eat().value) } as NumericLiteral
            case TokenType.Float:
                return { kind: "FloatLiteral", value: parseFloat(eat().value) } as FloatLiteral
            case TokenType.String:
                return { kind: "StringLiteral", value: eat().value } as StringLiteral
            case TokenType.OpenParen:
                eat() // (
                const value = parse_expression()
                const closing_paren = eat() // )

                if (closing_paren.type != TokenType.CloseParen) {
                    error("syntax", `Unexpected token ")" Expecting "("`)
                }
                return value
            default:
                console.log(at())
                const meta = at().meta

                error("syntax", `Unexpected token found during parsing: "${at().value}"` + ` Line: ${meta.line} Column: ${meta.column}`)
        }
    }

    tokens = tokenise(source_code)
    const program: Program = {
        kind: "Program",
        body: []
    }

    while (not_eof()) {
        program.body.push(parse_statement())
    }

    return program
}