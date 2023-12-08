export const getPosition = (element) => {
  const caret = isContentEditable(element) ? new EditableCaret(element) : new InputCaret(element)

  if (document.selection) {
    return caret.getIEPosition()
  }

  return caret.getPosition()
}

export const getOffset = (element) => {
  const caret = isContentEditable(element) ? new EditableCaret(element) : new InputCaret(element)

  return caret.getOffset()
}

// const EditableCaret = (function () {
/**
 *
 * @param element
 */
function EditableCaret(element) {
  this.domInputor = element
}

EditableCaret.prototype.setPos = function (pos) {
  let fn, found, offset, sel

  if ((sel = window.getSelection())) {
    offset = 0
    found = false;
    (fn = function (pos2, parent) {
      let node, range, _i, _len

      const _ref = parent.childNodes
      const _results = []

      for (_i = 0, _len = _ref.length; _i < _len; _i++) {
        node = _ref[_i]
        if (found) {
          break
        }
        if (node.nodeType === 3) {
          if (offset + node.length >= pos2) {
            found = true
            range = document.createRange()
            range.setStart(node, pos2 - offset)
            sel.removeAllRanges()
            sel.addRange(range)
            break
          } else {
            _results.push((offset += node.length))
          }
        } else {
          _results.push(fn(pos2, node))
        }
      }

      return _results
    })(pos, this.domInputor)
  }

  return this.domInputor
}

EditableCaret.prototype.getIEPosition = function () {
  return this.getPosition()
}

EditableCaret.prototype.getPosition = function () {
  const offset = this.getOffset()
  const inputorOffset = getOffsetUtils(this.domInputor)

  offset.left -= inputorOffset.left
  offset.top -= inputorOffset.top

  return offset
}

EditableCaret.prototype.getOldIEPos = function () {
  const textRange = document.selection.createRange()
  const preCaretTextRange = document.body.createTextRange()

  preCaretTextRange.moveToElementText(this.domInputor)
  preCaretTextRange.setEndPoint('EndToEnd', textRange)

  return preCaretTextRange.text.length
}

EditableCaret.prototype.getPos = function () {
  let clonedRange, pos, range

  if ((range = this.range())) {
    clonedRange = range.cloneRange()
    clonedRange.selectNodeContents(this.domInputor)
    clonedRange.setEnd(range.endContainer, range.endOffset)
    pos = clonedRange.toString().length
    clonedRange.detach()

    return pos
  } else if (document.selection) {
    return this.getOldIEPos()
  }
}

EditableCaret.prototype.getOldIEOffset = function () {
  const range = document.selection.createRange().duplicate()

  range.moveStart('character', -1)
  const rect = range.getBoundingClientRect()

  return {
    height: rect.bottom - rect.top,
    left: rect.left,
    top: rect.top,
  }
}

EditableCaret.prototype.getOffset = function () {
  let clonedRange, offset, range, rect, shadowCaret

  if (window.getSelection && (range = this.range())) {
    if (range.endOffset - 1 > 0 && range.endContainer !== this.domInputor) {
      clonedRange = range.cloneRange()
      clonedRange.setStart(range.endContainer, range.endOffset - 1)
      clonedRange.setEnd(range.endContainer, range.endOffset)
      rect = clonedRange.getBoundingClientRect()
      offset = {
        height: rect.height,
        left: rect.left + rect.width,
        top: rect.top,
      }
      clonedRange.detach()
    }
    if (!offset || (offset != null ? offset.height : void 0) === 0) {
      clonedRange = range.cloneRange()
      shadowCaret = document.createTextNode('|')
      clonedRange.insertNode(shadowCaret)
      clonedRange.selectNode(shadowCaret)
      rect = clonedRange.getBoundingClientRect()
      offset = {
        height: rect.height,
        left: rect.left,
        top: rect.top,
      }
      shadowCaret.remove()
      clonedRange.detach()
    }
  } else if (document.selection) {
    offset = this.getOldIEOffset()
  }
  if (offset) {
    offset.top += window.scrollY
    offset.left += window.scrollX
  }

  return offset
}

EditableCaret.prototype.range = function () {
  if (!window.getSelection) {
    return
  }
  const sel = window.getSelection()

  if (sel.rangeCount > 0) {
    return sel.getRangeAt(0)
  } else {
    return null
  }
}

//   return EditableCaret;
// })();

// const InputCaret = (function () {
/**
 *
 * @param element
 */
function InputCaret(element) {
  this.domInputor = element
}

InputCaret.prototype.getIEPos = function () {
  let endRange, len, normalizedValue, pos, textInputRange

  const inputor = this.domInputor
  const range = document.selection.createRange()

  pos = 0
  if (range && range.parentElement() === inputor) {
    normalizedValue = inputor.value.replace(/\r\n/g, '\n')
    len = normalizedValue.length
    textInputRange = inputor.createTextRange()
    textInputRange.moveToBookmark(range.getBookmark())
    endRange = inputor.createTextRange()
    endRange.collapse(false)
    if (textInputRange.compareEndPoints('StartToEnd', endRange) > -1) {
      pos = len
    } else {
      pos = -textInputRange.moveStart('character', -len)
    }
  }

  return pos
}

InputCaret.prototype.getPos = function () {
  if (document.selection) {
    return this.getIEPos()
  } else {
    return this.domInputor.selectionStart
  }
}

InputCaret.prototype.setPos = function (pos) {
  let range
  const inputor = this.domInputor

  if (document.selection) {
    range = inputor.createTextRange()
    range.move('character', pos)
    range.select()
  } else if (inputor.setSelectionRange) {
    inputor.setSelectionRange(pos, pos)
  }

  return inputor
}

InputCaret.prototype.getIEOffset = function (pos) {
  const textRange = this.domInputor.createTextRange()

  pos || (pos = this.getPos())
  textRange.move('character', pos)
  const x = textRange.boundingLeft
  const y = textRange.boundingTop
  const h = textRange.boundingHeight

  return {
    left: x,
    top: y,
    height: h,
  }
}

InputCaret.prototype.getOffset = function (pos) {
  let offset, position

  if (document.selection) {
    offset = this.getIEOffset(pos)
    offset.top += window.scrollY + this.domInputor.scrollTop
    offset.left += window.scrollX + this.domInputor.scrollLeft

    return offset
  } else {
    offset = getOffsetUtils(this.domInputor)
    position = this.getPosition(pos)

    return (offset = {
      left: offset.left + position.left - this.domInputor.scrollLeft,
      top: offset.top + position.top - this.domInputor.scrollTop,
      height: position.height,
    })
  }
}

InputCaret.prototype.getPosition = function (pos) {
  // let atRect, endRange, format, html, mirror, startRange

  const format = function (value) {
    value = value.replace(/<|>|`|"|&/g, '?').replace(/\r\n|\r|\n/g, '<br/>')
    if (/firefox/i.test(navigator.userAgent)) {
      value = value.replace(/\s/g, '&nbsp;')
    }

    return value
  }

  if (pos === void 0) {
    pos = this.getPos()
  }
  const startRange = this.domInputor.value.slice(0, pos)
  const endRange = this.domInputor.value.slice(pos)
  let html =
        "<span style='position: relative; display: inline;'>" +
        format(startRange) +
        '</span>'

  html +=
        "<span id='caret' style='position: relative; display: inline;'>|</span>"
  html +=
        "<span style='position: relative; display: inline;'>" +
        format(endRange) +
        '</span>'
  const mirror = new Mirror(this.domInputor)

  return (mirror.create(html).rect())
}

InputCaret.prototype.getIEPosition = function (pos) {
  const offset = this.getIEOffset(pos)
  const inputorOffset = getOffsetUtils(this.domInputor)
  const x = offset.left - inputorOffset.left
  const y = offset.top - inputorOffset.top
  const h = offset.height

  return {
    left: x,
    top: y,
    height: h,
  }
}

//   return InputCaret;
// })();

/**
 *
 * @param element
 */
function Mirror(element) {
  this.element = element
  this.cssAttr = [
    'borderBottomWidth',
    'borderLeftWidth',
    'borderRightWidth',
    'borderTopStyle',
    'borderRightStyle',
    'borderBottomStyle',
    'borderLeftStyle',
    'borderTopWidth',
    'boxSizing',
    'fontFamily',
    'fontSize',
    'fontWeight',
    'height',
    'letterSpacing',
    'lineHeight',
    'marginBottom',
    'marginLeft',
    'marginRight',
    'marginTop',
    'outlineWidth',
    'overflow',
    'overflowX',
    'overflowY',
    'paddingBottom',
    'paddingLeft',
    'paddingRight',
    'paddingTop',
    'textAlign',
    'textOverflow',
    'textTransform',
    'whiteSpace',
    'wordBreak',
    'wordWrap',
  ]
}

Mirror.prototype.mirrorCss = function () {
  const css = {
    position: 'absolute',
    left: '-9999px',
    top: '0',
    zIndex: '-20000',
  }

  if (this.element.tagName === 'TEXTAREA') {
    this.cssAttr.push('width')
  }

  // eslint-disable-next-line @typescript-eslint/no-this-alias
  const _this = this

  this.cssAttr.forEach(function (p) {
    css[p] = window.getComputedStyle(_this.element)[p]
  })

  return css
}

Mirror.prototype.create = function (html) {
  this.mirrorElement = document.createElement('div')
  for (const [key, value] of Object.entries(this.mirrorCss())) {
    this.mirrorElement.style[key] = value
  }
  this.mirrorElement.innerHTML = html
  this.element.insertAdjacentElement('afterend', this.mirrorElement)

  return this
}

Mirror.prototype.rect = function () {
  const flag = this.mirrorElement.querySelector('#caret')
  const pos = { left: flag.offsetLeft,
    top: flag.offsetTop }
  const rect = {
    left: pos.left,
    top: pos.top,
    height: flag.offsetHeight,
  }

  this.mirrorElement.remove()

  return rect
}

// utils
const isContentEditable = (element) => {
  return !!(element.contentEditable && element.contentEditable === 'true')
}

export const isInputAble = (element) => {
  return element.tagName === 'INPUT' || element.tagName === 'TEXTAREA' || isContentEditable(element)
}

/**
 *
 * @param element
 */
function getOffsetUtils(element) {
  const rect = element.getBoundingClientRect()
  const scrollLeft = window.pageXOffset || document.documentElement.scrollLeft
  const scrollTop = window.pageYOffset || document.documentElement.scrollTop

  return {
    top: rect.top + scrollTop,
    left: rect.left + scrollLeft,
  }
}
