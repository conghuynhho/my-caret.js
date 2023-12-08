const oWindow = window;
const oDocument = document;

const position = (element) => {
  let caret;

  caret = isContentEditable(element) ? new EditableCaret() : new InputCaret();

  if(oDocument.selection) {
    return caret.getIEPosition()
  }
  return caret.getPosition()
};

// const EditableCaret = (function () {
function EditableCaret(element) {
  this.domInputor = element;
}

EditableCaret.prototype.setPos = function (pos) {
  var fn, found, offset, sel;
  if ((sel = oWindow.getSelection())) {
    offset = 0;
    found = false;
    (fn = function (pos, parent) {
      var node, range, _i, _len, _ref, _results;
      _ref = parent.childNodes;
      _results = [];
      for (_i = 0, _len = _ref.length; _i < _len; _i++) {
        node = _ref[_i];
        if (found) {
          break;
        }
        if (node.nodeType === 3) {
          if (offset + node.length >= pos) {
            found = true;
            range = oDocument.createRange();
            range.setStart(node, pos - offset);
            sel.removeAllRanges();
            sel.addRange(range);
            break;
          } else {
            _results.push((offset += node.length));
          }
        } else {
          _results.push(fn(pos, node));
        }
      }
      return _results;
    })(pos, this.domInputor);
  }
  return this.domInputor;
};

EditableCaret.prototype.getIEPosition = function () {
  return this.getPosition();
};

EditableCaret.prototype.getPosition = function () {
  var inputor_offset, offset;
  offset = this.getOffset();
  console.log('aaaaaaaaaaaaaaaaaaaaaaaaa',this.domInputor);
  inputor_offset = this.domInputor.getBoundingClientRect();
  offset.left -= inputor_offset.left;
  offset.top -= inputor_offset.top;
  return offset;
};

EditableCaret.prototype.getOldIEPos = function () {
  var preCaretTextRange, textRange;
  textRange = oDocument.selection.createRange();
  preCaretTextRange = oDocument.body.createTextRange();
  preCaretTextRange.moveToElementText(this.domInputor);
  preCaretTextRange.setEndPoint("EndToEnd", textRange);
  return preCaretTextRange.text.length;
};

EditableCaret.prototype.getPos = function () {
  var clonedRange, pos, range;
  if ((range = this.range())) {
    clonedRange = range.cloneRange();
    clonedRange.selectNodeContents(this.domInputor);
    clonedRange.setEnd(range.endContainer, range.endOffset);
    pos = clonedRange.toString().length;
    clonedRange.detach();
    return pos;
  } else if (oDocument.selection) {
    return this.getOldIEPos();
  }
};

EditableCaret.prototype.getOldIEOffset = function () {
  var range, rect;
  range = oDocument.selection.createRange().duplicate();
  range.moveStart("character", -1);
  rect = range.getBoundingClientRect();
  return {
    height: rect.bottom - rect.top,
    left: rect.left,
    top: rect.top,
  };
};

EditableCaret.prototype.getOffset = function (pos) {
  var clonedRange, offset, range, rect, shadowCaret;
  if (oWindow.getSelection && (range = this.range())) {
    if (range.endOffset - 1 > 0 && range.endContainer !== this.domInputor) {
      clonedRange = range.cloneRange();
      clonedRange.setStart(range.endContainer, range.endOffset - 1);
      clonedRange.setEnd(range.endContainer, range.endOffset);
      rect = clonedRange.getBoundingClientRect();
      offset = {
        height: rect.height,
        left: rect.left + rect.width,
        top: rect.top,
      };
      clonedRange.detach();
    }
    if (!offset || (offset != null ? offset.height : void 0) === 0) {
      clonedRange = range.cloneRange();
      shadowCaret = oDocument.createTextNode("|");
      clonedRange.insertNode(shadowCaret);
      clonedRange.selectNode(shadowCaret);
      rect = clonedRange.getBoundingClientRect();
      offset = {
        height: rect.height,
        left: rect.left,
        top: rect.top,
      };
      shadowCaret.remove();
      clonedRange.detach();
    }
  } else if (oDocument.selection) {
    offset = this.getOldIEOffset();
  }
  if (offset) {
    offset.top += oWindow.scrollY;
    offset.left += oWindow.scrollX;
  }
  return offset;
};

EditableCaret.prototype.range = function () {
  var sel;
  if (!oWindow.getSelection) {
    return;
  }
  sel = oWindow.getSelection();
  if (sel.rangeCount > 0) {
    return sel.getRangeAt(0);
  } else {
    return null;
  }
};

//   return EditableCaret;
// })();

// const InputCaret = (function () {
function InputCaret(element) {
  this.domInputor = element;
}

InputCaret.prototype.getIEPos = function () {
  var endRange, inputor, len, normalizedValue, pos, range, textInputRange;
  inputor = this.domInputor;
  range = oDocument.selection.createRange();
  pos = 0;
  if (range && range.parentElement() === inputor) {
    normalizedValue = inputor.value.replace(/\r\n/g, "\n");
    len = normalizedValue.length;
    textInputRange = inputor.createTextRange();
    textInputRange.moveToBookmark(range.getBookmark());
    endRange = inputor.createTextRange();
    endRange.collapse(false);
    if (textInputRange.compareEndPoints("StartToEnd", endRange) > -1) {
      pos = len;
    } else {
      pos = -textInputRange.moveStart("character", -len);
    }
  }
  return pos;
};

InputCaret.prototype.getPos = function () {
  if (oDocument.selection) {
    return this.getIEPos();
  } else {
    return this.domInputor.selectionStart;
  }
};

InputCaret.prototype.setPos = function (pos) {
  var inputor, range;
  inputor = this.domInputor;
  if (oDocument.selection) {
    range = inputor.createTextRange();
    range.move("character", pos);
    range.select();
  } else if (inputor.setSelectionRange) {
    inputor.setSelectionRange(pos, pos);
  }
  return inputor;
};

InputCaret.prototype.getIEOffset = function (pos) {
  var h, textRange, x, y;
  textRange = this.domInputor.createTextRange();
  pos || (pos = this.getPos());
  textRange.move("character", pos);
  x = textRange.boundingLeft;
  y = textRange.boundingTop;
  h = textRange.boundingHeight;
  return {
    left: x,
    top: y,
    height: h,
  };
};

InputCaret.prototype.getOffset = function (pos) {
  var offset, position;
  if (oDocument.selection) {
    offset = this.getIEOffset(pos);
    offset.top += oWindow.scrollY + this.domInputor.scrollTop;
    offset.left += oWindow.scrollX + this.domInputor.scrollLeft;
    return offset;
  } else {
    offset = this.domInputor.getBoundingClientRect();
    position = this.getPosition(pos);
    return (offset = {
      left: offset.left + position.left - this.domInputor.scrollLeft,
      top: offset.top + position.top - this.domInputor.scrollTop,
      height: position.height,
    });
  }
};

InputCaret.prototype.getPosition = function (pos) {
  var at_rect, end_range, format, html, mirror, start_range;
  format = function (value) {
    value = value.replace(/<|>|`|"|&/g, "?").replace(/\r\n|\r|\n/g, "<br/>");
    if (/firefox/i.test(navigator.userAgent)) {
      value = value.replace(/\s/g, "&nbsp;");
    }
    return value;
  };
  if (pos === void 0) {
    pos = this.getPos();
  }
  start_range = this.domInputor.value.substring(0, pos);
  end_range = this.domInputor.value.substring(pos);
  html =
    "<span style='position: relative; display: inline;'>" +
    format(start_range) +
    "</span>";
  html +=
    "<span id='caret' style='position: relative; display: inline;'>|</span>";
  html +=
    "<span style='position: relative; display: inline;'>" +
    format(end_range) +
    "</span>";
  mirror = new Mirror(this.domInputor);
  return (at_rect = mirror.create(html).rect());
};

InputCaret.prototype.getIEPosition = function (pos) {
  var h, inputorOffset, offset, x, y;
  offset = this.getIEOffset(pos);
  inputorOffset = this.domInputor.getBoundingClientRect();
  x = offset.left - inputorOffset.left;
  y = offset.top - inputorOffset.top;
  h = offset.height;
  return {
    left: x,
    top: y,
    height: h,
  };
};

//   return InputCaret;
// })();

function Mirror(element) {
  this.element = element;
  this.css_attr = [
    "borderBottomWidth",
    "borderLeftWidth",
    "borderRightWidth",
    "borderTopStyle",
    "borderRightStyle",
    "borderBottomStyle",
    "borderLeftStyle",
    "borderTopWidth",
    "boxSizing",
    "fontFamily",
    "fontSize",
    "fontWeight",
    "height",
    "letterSpacing",
    "lineHeight",
    "marginBottom",
    "marginLeft",
    "marginRight",
    "marginTop",
    "outlineWidth",
    "overflow",
    "overflowX",
    "overflowY",
    "paddingBottom",
    "paddingLeft",
    "paddingRight",
    "paddingTop",
    "textAlign",
    "textOverflow",
    "textTransform",
    "whiteSpace",
    "wordBreak",
    "wordWrap",
  ];
}

Mirror.prototype.mirrorCss = function () {
  var css = {
    position: "absolute",
    left: "-9999px",
    top: "0",
    zIndex: "-20000",
  };

  if (this.element.tagName === "TEXTAREA") {
    this.css_attr.push("width");
  }

  var _this = this;
  this.css_attr.forEach(function (p) {
    css[p] = window.getComputedStyle(_this.element).getPropertyValue(p);
  });

  return css;
};

Mirror.prototype.create = function (html) {
  this.mirrorElement = document.createElement("div");
  this.mirrorElement.style.cssText = Object.entries(this.mirrorCss())
    .map(([key, value]) => `${key}: ${value};`)
    .join(" ");
  this.mirrorElement.innerHTML = html;
  this.element.insertAdjacentElement("afterend", this.mirrorElement);
  return this;
};

Mirror.prototype.rect = function () {
  var flag = this.mirrorElement.querySelector("#caret");
  var pos = { left: flag.offsetLeft, top: flag.offsetTop };
  var rect = { left: pos.left, top: pos.top, height: flag.clientHeight };
  this.mirrorElement.remove();
  return rect;
};

// utils
const isContentEditable = (element) => {
  return !!(element.contentEditable && element.contentEditable === "true");
};
