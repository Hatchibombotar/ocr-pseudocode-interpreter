import * as monaco from "monaco-editor"

export default ({
	defaultToken: 'invalid',
	tokenPostfix: '.pseudocode',

	keywords: [
		"array", "for", "to", "next", "while", "endwhile", "do",
		"until", "if", "elseif", "else", "endif", "then",
		"switch", "case", "default", "endswitch",
		"function", "endfunction", "procedure", "endprocedure", "return"
	],

	text_operations: [
		"NOT"
	],

	builtin_functions: [
		"print", "input", "int", "str", "openRead", "openWrite",
		"substring", "length", "readLine", "writeLine", "endOfFile", "close"
	],

	operators: [
		"==", "!=", ">=", "<=", "+", "-", "*", "/", "^", ">", "<", "!", "="
	],

	// we include these common regular expressions
	symbols: /[=><!~?:&|+\-*\/\^%]+/,
	escapes: /\\(?:[abfnrtv\\"']|x[0-9A-Fa-f]{1,4}|u[0-9A-Fa-f]{4}|U[0-9A-Fa-f]{8})/,
	digits: /\d+(_+\d+)*/,

	// The main tokenizer for our languages
	tokenizer: {
		root: [
			[/[{}]/, 'delimiter.bracket'],
			{ include: 'common' }
		],

		common: [
			{ include: '@whitespace' },
			[/@symbols/, {
				cases: {
					'@operators': 'operators',
					'@default': ''
				}
			}],
			// identifiers and keywords
			[/[a-zA-Z_$][\w$]*/, {
				cases: {
					'@text_operations': 'operators',
					'@keywords': 'keyword',
					'@builtin_functions': 'keyword',
					'@default': 'identifier'
				}
			}],
			// [/[A-Z][\w\$]*/, 'identifier'],


			// delimiters and operators
			[/[()\[\]]/, '@brackets'],
			[/[<>](?!@symbols)/, '@brackets'],

			// numbers
			[/(@digits)[eE]([\-+]?(@digits))?/, 'number.float'],
			[/(@digits)\.(@digits)([eE][\-+]?(@digits))?/, 'number.float'],
			// [/0[xX](@hexdigits)/, 'number.hex'],
			// [/0[oO]?(@octaldigits)/, 'number.octal'],
			// [/0[bB](@binarydigits)/, 'number.binary'],
			[/(@digits)/, 'number'],

			// delimiter: after number because of .\d floats
			[/[,.]/, 'delimiter'],

			// strings
			[/"([^"\\]|\\.)*$/, 'string.invalid'],  // non-teminated string
			[/'([^'\\]|\\.)*$/, 'string.invalid'],  // non-teminated string
			[/"/, 'string', '@string_double'],
			[/'/, 'string', '@string_single'],
		],

		whitespace: [
			[/[ \t\r\n]+/, ''],
			[/\/\/.*$/, 'comment'],
		],

		string_double: [
			[/[^\\"]+/, 'string'],
			[/@escapes/, 'string.escape'],
			[/\\./, 'string.escape.invalid'],
			[/"/, 'string', '@pop']
		],

		string_single: [
			[/[^\\']+/, 'string'],
			[/@escapes/, 'string.escape'],
			[/\\./, 'string.escape.invalid'],
			[/'/, 'string', '@pop']
		],

		bracketCounting: [
			[/\{/, 'delimiter.bracket', '@bracketCounting'],
			[/\}/, 'delimiter.bracket', '@pop'],
			{ include: 'common' }
		],
	},
}) as monaco.languages.IMonarchLanguage