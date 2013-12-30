'use strict';

var Lexer = module.exports = function() {
  this.pos = 0;
  this.buf = null;
  this.buflen = 0;
}

// Initialize the Lexer's buffer. This resets the lexer's internal
// state and subsequent tokens will be returned starting with the
// beginning of the new buffer.
Lexer.prototype.input = function(buf) {
  this.pos = 0
  this.buf = buf
  this.buflen = buf.length
}

// Get the next token from the current buffer. A token is an object with
// the following properties:
// - name: name of the pattern that this token matched (taken from rules).
// - value: actual string value of the token.
// - pos: offset in the current buffer where the token starts.
//
// If there are no more tokens in the buffer, returns null. In case of
// an error throws Error.
Lexer.prototype.token = function() {
  // this._skipnontokens();
  if (this.pos >= this.buflen) {
    return null
  }

  // The char at this.pos is part of a real token. Figure out which.
  var c = this.buf.charAt(this.pos)

  // Look it up in the table of operators
  var op = Lexer.optable[c]
  if (op !== undefined) {
    return {name: op, value: c, pos: this.pos++}
  } else {
    // Not an operator - so it's the beginning of another token.
     if (Lexer._isdigit(c)) {
      return this._process_number()
    } else if (Lexer._iswhitespace(c)) {
      return this._process_whitespace()
    } else if (c === '&') {
      return this._process_ampersand()
    } else if (Lexer._istext(c)) {
      return this._process_text()
    } else {
      throw Error('Token error at ' + this.pos + ' "'+c+'"')
    }
  }
}

Lexer.optable = {
  '\n': 'NEW_LINE',
  '\\': 'BACKSLASH',
  '/':  'SLASH',
  '.':  'DOT',
  '`':  'BACKTICK',
  '_':  'UNDERSCORE',
  '-':  'HYPHEN',
  '!':  'BANG',
  '#':  'HASH',
  '+':  'PLUS',
  ':':  'COLON',
  '*':  'ASTERISK',
  '"':  'QUOTE',
  '(':  'L_PAREN',
  ')':  'R_PAREN',
  '<':  'L_ANG',
  '>':  'R_ANG',
  '{':  'L_BRACE',
  '}':  'R_BRACE',
  '[':  'L_BRACKET',
  ']':  'R_BRACKET',
  '=':  'EQUALS'
}

Lexer._isnewline = function(c) {
  return c === '\r' || c === '\n'
}

Lexer._iswhitespace = function(c) {
  return c === ' ' || c === '\t'
}

Lexer._isdigit = function(c) {
  return c >= '0' && c <= '9'
}

Lexer._isalpha = function(c) {
  return (c >= 'a' && c <= 'z') ||
         (c >= 'A' && c <= 'Z') ||
         c === '$' || c === ',' // || c === '_'
}

Lexer._isalphanum = function(c) {
  return (c >= 'a' && c <= 'z') ||
         (c >= 'A' && c <= 'Z') ||
         (c >= '0' && c <= '9')
}

Lexer._istext = function(c) {
  return (c >= 'a' && c <= 'z') ||
         (c >= 'A' && c <= 'Z') ||
         (c >= '0' && c <= '9') ||
         !this.optable[c]
}

Lexer.prototype._process_number = function() {
  var endpos = this.pos + 1;
  while (endpos < this.buflen &&
         Lexer._isdigit(this.buf.charAt(endpos))) {
    endpos++;
  }

  var tok = {
    name: 'NUMBER',
    value: this.buf.substring(this.pos, endpos),
    pos: this.pos
  };
  this.pos = endpos;
  return tok;
}

// Lexer.prototype._process_comment = function() {
//   var endpos = this.pos + 2;
//   // Skip until the end of the line
//   var c = this.buf.charAt(this.pos + 2);
//   while (endpos < this.buflen &&
//          !Lexer._isnewline(this.buf.charAt(endpos))) {
//     endpos++;
//   }

//   var tok = {
//     name: 'COMMENT',
//     value: this.buf.substring(this.pos, endpos),
//     pos: this.pos
//   };
//   this.pos = endpos + 1;
//   return tok;
// }

Lexer.prototype._process_text = function() {
  var endpos = this.pos + 1
  while (endpos < this.buflen &&
         Lexer._istext(this.buf.charAt(endpos))) {
    endpos++
  }

  var tok = {
    name: 'TEXT',
    value: this.buf.substring(this.pos, endpos),
    pos: this.pos
  }
  this.pos = endpos
  return tok
}

Lexer.prototype._process_whitespace = function() {
  var endpos = this.pos + 1
  while (endpos < this.buflen &&
         Lexer._iswhitespace(this.buf.charAt(endpos))) {
    endpos++
  }

  var tok = {
    name: 'WHITESPACE',
    value: this.buf.substring(this.pos, endpos),
    pos: this.pos
  }
  this.pos = endpos
  return tok
}

Lexer.prototype._process_ampersand = function() {
  var name = 'AMPERSAND'
  var endpos = this.pos + this.buf.substring(this.pos, this.pos+6).indexOf(';') + 1
  if (endpos === this.pos) {
    endpos = this.pos + 1
  } else {
    for (var i = this.pos; i < endpos; i++) {
      if (Lexer._isalphanum(this.pos+i)) {
        endpos = this.pos + 1
        break
      }
    }
  }

  var name = endpos === this.pos+1 ? 'AMPERSAND' : 'ENCODED_CHAR'
  var tok = {
    name: name,
    value: this.buf.substring(this.pos, endpos),
    pos: this.pos
  }
  this.pos = endpos
  return tok
}

// Lexer.prototype._process_quote = function() {
//   // this.pos points at the opening quote. Find the ending quote.
//   var end_index = this.buf.indexOf('"', this.pos + 1);

//   if (end_index === -1) {
//     throw Error('Unterminated quote at ' + this.pos);
//   } else {
//     var tok = {
//       name: 'QUOTE',
//       value: this.buf.substring(this.pos, end_index + 1),
//       pos: this.pos
//     };
//     this.pos = end_index + 1;
//     return tok;
//   }
// }

// Lexer.prototype._skipnontokens = function() {
//   while (this.pos < this.buflen) {
//     var c = this.buf.charAt(this.pos);
//     if (c == ' ' || c == '\t' || c == '\r' || c == '\n') {
//       this.pos++;
//     } else {
//       break;
//     }
//   }
// }
