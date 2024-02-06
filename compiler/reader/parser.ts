import { error } from "../errors";
import { Statement, Program, Expression, BinaryExpression, NumericLiteral, Identifier, NullLiteral, VariableDeclaration, AssignmentExpression, ArrayDeclaration, CallExpression, MemberExpression, StringLiteral, FunctionDeclaration, IfStatement, ReturnStatement, ForLoop, WhileLoop, DoUntilLoop, UnaryExpression, CaseStatement, SwitchStatement, FloatLiteral, RangeExpression } from "./ast";
import { tokenise, Token, TokenType } from "./lexer";

export default class Parser {

    private tokens: Token[] = []

    private at() {
        return this.tokens[0]
    }

    private eat() {
        const prev = this.tokens.shift() as Token
        return prev
    }

    private expect(type: TokenType, provided_error: any) {
        const previous = this.tokens.shift() as Token;
        if (!previous || previous.type != type) {
            error("syntax", provided_error + previous + " - Expecting: " + type);
        }

        return previous;
    }

    public produceAST(source_code: string): Program {
        this.tokens = tokenise(source_code)
        const program: Program = {
            kind: "Program",
            body: []
        }

        while (this.not_eof()) {
            program.body.push(this.parse_statement())
        }

        return program
    }

    private not_eof() {
        return this.tokens[0].type != TokenType.EOF
    }

    private parse_statement(): Statement {
        switch (this.at().type) {
            case TokenType.Let:
                return this.parse_variable_declaration()
            case TokenType.Array:
                return this.parse_array_declaration()
            case TokenType.Procedure:
            case TokenType.Function:
                return this.parse_function_declaration()
            case TokenType.Return:
                return this.parse_return_statement()
            case TokenType.If:
                return this.parse_if_statement()
            case TokenType.Switch:
                return this.parse_switch_statement()
            case TokenType.For:
                return this.parse_for_statement()
            case TokenType.While:
                return this.parse_while_statement()
            case TokenType.Do:
                return this.parse_do_until_statement()
            default:
                return this.parse_expression()
        }
    }

    private parse_for_statement(): Statement {
        this.eat() // for
        const variable = this.expect(TokenType.Identifier, "Expected variable in for loop.").value
        this.eat() // =
        const initial_value = this.parse_multiplicative_expression() // skips assignment and range so the "to" does not make it get passes as a range
        // TODO: use ranges instead of parsing items individially?
        this.eat() // to
        const end_value = this.parse_expression()
        const body: Statement[] = []


        while (this.at().type != TokenType.EOF && this.at().type != TokenType.Next) {
            body.push(this.parse_statement())
        }

        this.eat() // next
        const loop_variable = this.expect(TokenType.Identifier, "Expected variable after next keyword in for loop.").value
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

    private parse_while_statement(): Statement {
        this.eat() // while
        const condition = this.parse_expression()
        const body: Statement[] = []


        while (this.at().type != TokenType.EOF && this.at().type != TokenType.EndWhile) {
            body.push(this.parse_statement())
        }

        this.eat() // endwhile

        return {
            kind: "WhileLoop",
            condition,
            body
        } as WhileLoop
    }

    private parse_do_until_statement(): Statement {
        this.eat() // do
        const body: Statement[] = []


        while (this.at().type != TokenType.EOF && this.at().type != TokenType.Until) {
            body.push(this.parse_statement())
        }

        this.eat() // until
        const condition = this.parse_expression()

        return {
            kind: "DoUntilLoop",
            condition,
            body
        } as DoUntilLoop
    }

    private parse_switch_statement(): Statement {
        this.eat() // switch
        const discriminant = this.parse_expression()
        this.expect(TokenType.Colon, "Expected colon following discriminant in switch/case statement")
        const cases: CaseStatement[] = []

        while (this.at().type != TokenType.EOF && this.at().type != TokenType.EndSwitch) {
            const initialiser = this.eat()
            if (initialiser.type != TokenType.Default && initialiser.type != TokenType.Case) {
                error("syntax", `Expected keyword "default" or "case" inside switch statement.`)
            }
            const test = initialiser.type == TokenType.Case ? this.parse_expression() : null
            this.expect(TokenType.Colon, "Expected colon following test in case statement")
            const then: Statement[] = []

            while (this.at().type != TokenType.EOF && this.at().type != TokenType.EndSwitch && this.at().type != TokenType.Case && this.at().type != TokenType.Default) {
                then.push(this.parse_statement())
            }

            cases.push({
                kind: "CaseStatement",
                test,
                then
            })
        }

        this.eat() // endswitch

        return {
            kind: "SwitchStatement",
            cases,
            discriminant
        } as SwitchStatement
    }

    private parse_if_statement(): Statement {
        this.eat() // if | elseif
        const condition = this.parse_expression()
        this.eat() // then
        const then: Statement[] = []

        while (this.at().type != TokenType.EOF && this.at().type != TokenType.EndIf && this.at().type != TokenType.Else && this.at().type != TokenType.ElseIf) {
            then.push(this.parse_statement())
        }

        if (this.at().type == TokenType.ElseIf) {
            const alternate = this.parse_if_statement()
            return {
                kind: "IfStatement",
                condition,
                then,
                else: [alternate],
            } as IfStatement
        } else if (this.at().type == TokenType.Else) {
            this.eat() // else
            const alternate: Statement[] = []

            while (this.at().type != TokenType.EOF && this.at().type != TokenType.EndIf) {
                alternate.push(this.parse_statement())
            }
            this.eat() // endif


            return {
                kind: "IfStatement",
                condition,
                then,
                else: alternate,
            } as IfStatement
        }

        this.eat() // endif

        return {
            kind: "IfStatement",
            condition,
            then,
            else: null,
        } as IfStatement
    }


    private parse_function_declaration(): Statement {
        const keyword = this.eat() // function | procedure
        const name = this.expect(TokenType.Identifier, `Expected identifier name following ${keyword.value} keyword.`).value

        const args = this.parse_arguments()
        const parameters: string[] = []
        for (const arg of args) {
            if (arg.kind != "Identifier") {
                error("syntax", "Only identifiers are supported as parameters.")
            }
            parameters.push((arg as Identifier).symbol)
        }

        // this.expect(TokenType.NL, "Expected newline after function declatation")

        const body: Statement[] = []

        const end_token = keyword.type == TokenType.Function ? TokenType.EndFunction : TokenType.EndProcedure
        const end_keyword = keyword.type == TokenType.Function ? "endfunction" : "endprocedure"

        while (this.at().type != TokenType.EOF && this.at().type != end_token) {
            body.push(this.parse_statement())
        }

        this.expect(end_token, `Expected ${end_keyword} keyword following ${keyword.value} body.`)

        const function_declaration = {
            kind: keyword.type == TokenType.Function ? "FunctionDeclaration" : "ProcedureDeclaration",
            identifier: name,
            parameters,
            body
        } as Statement

        return function_declaration
    }

    private parse_return_statement(): Statement {
        this.eat() // eat return
        const return_statement = {
            kind: "ReturnStatement",
            value: this.parse_expression()
        } as ReturnStatement

        return return_statement
    }

    private parse_array_declaration(): Statement {
        this.eat() // array
        const identifier = this.expect(TokenType.Identifier, "Expected identifier name after array keyword").value
        this.expect(TokenType.OpenSquare, "Expected '[' following identifer in array definition")

        const dimensions = []
        while (this.at().type != TokenType.EOF && this.at().type != TokenType.CloseSquare) {
            const dimension = this.parse_expression()
            dimensions.push(dimension)
            const next = this.at()

            if (next.type == TokenType.Comma) {
                this.eat()
                continue
            } else if (next.type == TokenType.CloseSquare) {
                break
            } else {
                error("syntax", `Unexpected token ${next.type} ${next.value} following array dimension.`)
            }
        }

        this.expect(TokenType.CloseSquare, "Expected ']' following array dimensions in array definition")

        return {
            identifier,
            kind: "ArrayDeclaration",
            dimensions
        } as ArrayDeclaration
    }

    private parse_variable_declaration(): Statement {
        this.eat()
        const identifier = this.expect(TokenType.Identifier, "Expected identifier name after let | const keyword").value
        this.expect(TokenType.Equals, "Expected = following identifer in assignment ")

        return {
            identifier,
            kind: "VariableDeclaration",
            value: this.parse_expression()
        } as VariableDeclaration
    }

    private parse_expression(): Expression {
        return this.parse_assignment_expression()
    }

    private parse_assignment_expression(): Expression {
        let left = this.parse_range_expression()

        while (this.at().type == TokenType.Equals) {
            this.eat()
            const value = this.parse_assignment_expression()
            left = {
                kind: "AssignmentExpression",
                assign_to: left,
                value
            } as AssignmentExpression
        }

        return left
    }

    private parse_range_expression(): Expression {
        let left = this.parse_multiplicative_expression()

        while (this.at().type == TokenType.To) {
            this.eat()

            const right = this.parse_multiplicative_expression()
            left = {
                kind: "RangeExpression",
                left,
                right
            } as RangeExpression
        }

        return left
    }

    private parse_multiplicative_expression(): Expression {
        let left = this.parse_additive_expression()

        while (this.at().value == "/" || this.at().value == "*" || this.at().value == "MOD" || this.at().value == "DIV") {
            const operator = this.eat().value
            const right = this.parse_additive_expression()
            left = {
                kind: "BinaryExpression",
                left,
                right,
                operator
            } as BinaryExpression
        }

        return left
    }


    private parse_additive_expression(): Expression {
        let left = this.parse_exponent_expression()

        while (this.at().value == "+" || this.at().value == "-") {
            const operator = this.eat().value
            const right = this.parse_exponent_expression()
            left = {
                kind: "BinaryExpression",
                left,
                right,
                operator
            } as BinaryExpression
        }

        return left
    }



    private parse_exponent_expression(): Expression {
        let left = this.parse_boolean_or_expression()

        while (this.at().value == "^") {
            const operator = this.eat().value
            const right = this.parse_boolean_or_expression()
            left = {
                kind: "BinaryExpression",
                left,
                right,
                operator
            } as BinaryExpression
        }

        return left
    }

    private parse_boolean_or_expression(): Expression {
        let left = this.parse_boolean_and_expression()

        while (this.at().value == "OR") {
            const operator = this.eat().value
            const right = this.parse_boolean_and_expression()
            left = {
                kind: "BinaryExpression",
                left,
                right,
                operator
            } as BinaryExpression
        }

        return left
    }

    private parse_boolean_and_expression(): Expression {
        let left = this.parse_comparison_expression()

        while (this.at().value == "AND") {
            const operator = this.eat().value
            const right = this.parse_comparison_expression()
            left = {
                kind: "BinaryExpression",
                left,
                right,
                operator
            } as BinaryExpression
        }

        return left
    }

    private parse_comparison_expression(): Expression {
        let left = this.parse_not_expression()

        while (["==", "!=", ">", "<", ">=", "<="].includes(this.at().value)) {
            const operator = this.eat().value
            const right = this.parse_not_expression()
            left = {
                kind: "BinaryExpression",
                left,
                right,
                operator
            } as BinaryExpression
        }

        return left
    }


    private parse_not_expression(): Expression {
        if (this.at().value == "NOT") {
            const operator = this.eat().value
            const right = this.parse_not_expression()
            return {
                kind: "UnaryExpression",
                right,
                operator
            } as UnaryExpression
        }
        return this.parse_positive_expression()
    }

    private parse_positive_expression(): Expression {
        if (this.at().value == "+") {
            const operator = this.eat().value
            const right = this.parse_positive_expression()
            return {
                kind: "UnaryExpression",
                right,
                operator
            } as UnaryExpression
        }
        return this.parse_negative_expression()
    }

    private parse_negative_expression(): Expression {
        if (this.at().value == "-") {
            const operator = this.eat().value
            const right = this.parse_positive_expression()
            return {
                kind: "UnaryExpression",
                right,
                operator
            } as UnaryExpression
        }
        return this.parse_member_call_expression()
    }

    // NOT is NOT a binary operator.

    // private parse_boolean_not_expression(): Expression {
    //     let left = this.parse_member_call_expression()

    //     while (this.at().value == "NOT") {
    //         const operator = this.eat().value
    //         const right = this.parse_member_call_expression()
    //         left = {
    //             kind: "BinaryExpression",
    //             left,
    //             right,
    //             operator
    //         } as BinaryExpression
    //     }

    //     return left
    // }


    private parse_member_call_expression(): Expression {
        const member = this.parse_member_expression()

        if (this.at().type == TokenType.OpenParen) {
            return this.parse_call_expression(member)
        }

        return member
    }

    private parse_call_expression(caller: Expression): Expression {
        let call_expression: Expression = {
            kind: "CallExpression",
            caller,
            arguments: this.parse_arguments()
        } as CallExpression

        if (this.at().type == TokenType.OpenParen) {
            call_expression = this.parse_call_expression(call_expression)
        }

        return call_expression
    }

    private parse_arguments(): Expression[] {
        this.expect(TokenType.OpenParen, "Expected open parenthesis")
        const argument_list = this.at().type == TokenType.CloseParen ? [] : this.parse_arguments_list()
        this.expect(TokenType.CloseParen, "Missing closing paren inside args list")

        return argument_list
    }

    private parse_arguments_list(): Expression[] {
        const argument_list = [this.parse_expression()]

        while (this.at().type == TokenType.Comma && this.eat()) {
            argument_list.push(this.parse_expression())
        }

        return argument_list
    }

    private parse_member_expression(): Expression {
        let object = this.parse_primary_expression()

        while (this.at().type == TokenType.OpenSquare || this.at().type == TokenType.Dot) {
            let property: Expression;

            if (this.at().type == TokenType.Dot) {
                this.eat()
                property = this.parse_primary_expression()
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
                this.eat() // open bracket

                while (this.at().type != TokenType.EOF) {
                    const property = this.parse_expression();
                    object = {
                        kind: "MemberExpression",
                        object,
                        property,
                        computed: true
                    } as MemberExpression

                    if (this.at().type == TokenType.Comma) {
                        this.eat()
                    } else if (this.at().type == TokenType.CloseSquare) {
                        this.eat()
                        break
                    }
                }
            }

        }

        return object
    }

    private parse_primary_expression(): Expression {
        const current_token = this.at().type

        switch (current_token) {
            case TokenType.Identifier:
                return { kind: "Identifier", symbol: this.eat().value } as Identifier
            case TokenType.Null:
                this.eat()
                return { kind: "NullLiteral", value: "null" } as NullLiteral
            case TokenType.Integer:
                return { kind: "NumericLiteral", value: parseFloat(this.eat().value) } as NumericLiteral
            case TokenType.Float:
                return { kind: "FloatLiteral", value: parseFloat(this.eat().value) } as FloatLiteral
            case TokenType.String:
                return { kind: "StringLiteral", value: this.eat().value } as StringLiteral
            case TokenType.OpenParen:
                this.eat() // (
                const value = this.parse_expression()
                const closing_paren = this.eat() // )

                if (closing_paren.type != TokenType.CloseParen) {
                    error("syntax", `Unexpected token ")" Expecting "("`)
                }
                return value
            default:
                console.log(this.at())
                const meta = this.at().meta

                error("syntax", `Unexpected token found during parsing: "${this.at().value}"` + ` Line: ${meta.line} Column: ${meta.column}`)
        }
    }
}