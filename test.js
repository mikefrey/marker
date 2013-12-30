var fs = require('fs')

var md = fs.readFileSync(__dirname+'/test.md', 'utf8')

var Lexer = require('./lexer')

var lexer = new Lexer()
lexer.input(md)

var tokens = []
var token

while (token = lexer.token()) {
  tokens.push(token)
}

console.log(tokens)
