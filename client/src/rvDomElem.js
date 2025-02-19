import jQuery from 'jquery';
import Image from './image.js';

const _$ = jQuery.noConflict(true);

class RvDomElem {
  constructor() {
    this._name = 'RvDomElem';

    this._docBody = null;

    this.rvSupportButton = null;
    this._supportButtonId = 'remoteViewSupportRequestButton';
    this.rvSupportButtonTexts = ['Help and support', 'Disable Remote View'];

    this.rvSupportCursor = null;
    this._supportCursorId = 'remoteViewCursor';
    this.rvSupportCursorDisplays = ['none', 'block'];
  }

  get name() {
    return this._name;
  }

  supportButtonId() {
    return this._supportButtonId;
  }

  supportCursorId() {
    return this._supportCursorId;
  }

  supportButtonActive() {
    return _$('#' + this.supportButtonId()).html() === this.rvSupportButtonTexts[1];
  }

  docBody(bodyElem) {
    this._docBody = bodyElem;
  }

  // Create the support button with whatever initial parameters are best
  createSupportButton() {
    this.rvSupportButton = document.createElement('p');
    this.rvSupportButton.id = this.supportButtonId();
    this.rvSupportButton.style.cssText = 'background-color: blue; width: 148px; position: ' +
      'absolute; bottom: 0; right: 0; z-index: 2147483647;';
    this.rvSupportButton.innerHTML = this.rvSupportButtonTexts[0];
  }

  // Create the support cursor with whatever style you want
  createSupportCursor() {
    this.rvSupportCursor = document.createElement('img');
    this.rvSupportCursor.id = this.supportCursorId();
    this.rvSupportCursor.style.cssText = 'display: none; position: fixed; z-index: ' +
      '2147483647; width: 30px; height: 30px;';
    this.rvSupportCursor.src = Image.defaultCursor();
  }

  // Toggle support button text
  toggleSupportButton(onOffBool = '') {
    if (onOffBool === '') {
      let nextTextInd = (this.rvSupportButtonTexts.indexOf(this.rvSupportButton.innerHTML) === 0) ? 1 : 0;

      this.rvSupportButton.innerHTML = this.rvSupportButtonTexts[nextTextInd];
      _$('#' + this.supportButtonId()).html(this.rvSupportButtonTexts[nextTextInd]);
    } else {
      let supportButtonHtml = (onOffBool) ? this.rvSupportButtonTexts[1] :
        this.rvSupportButtonTexts[0];

      this.rvSupportButton.innerHTML = supportButtonHtml;
      _$('#' + this.supportButtonId()).html(supportButtonHtml);
    }
  }

  // Toggle support cursor to showing or not showing
  toggleSupportCursor(onOffBool = '') {
    if (onOffBool === '') {
      let nextDisplayInd = (this.rvSupportButtonTexts.indexOf(this.rvSupportButton.innerHTML) === 0) ? 1 : 0;

      this.rvSupportCursor.style.cssText =
      this.rvSupportCursor.style.cssText.replace('display: ' +
      this.rvSupportButtonTexts[Math.abs(nextDisplayInd - 1)],
      'display: ' + this.rvSupportButtonTexts[nextDisplayInd]);

      _$('#' + this.supportCursorId()).css('display', this.rvSupportCursorDisplays[nextDisplayInd]);
    } else {
      let supportCursorDisplayInd = (onOffBool) ? 1 : 0;

      let supportCursorDisplay = this.rvSupportCursorDisplays[supportCursorDisplayInd];

      this.rvSupportCursor.style.cssText =
      this.rvSupportCursor.style.cssText.replace('display: ' +
      this.rvSupportButtonTexts[Math.abs(supportCursorDisplayInd - 1)],
      'display: ' + this.rvSupportButtonTexts[supportCursorDisplayInd]);

      _$('#' + this.supportCursorId()).css('display', supportCursorDisplay);
    }
  }

  // Tilt support cursor briefly (showing other user clicks)
  tiltSupportCursor(leftClick = true) {
    let rvDegrees = (leftClick) ? 'rotate(45deg)' : 'rotate(-45deg)';

    _$('#' + this.supportCursorId()).css('transform', rvDegrees);
    setTimeout(() => {
      _$('#' + this.supportCursorId()).css('transform', 'rotate(0deg)');
    }, 500);
  }

  // Move support cursor based on other user mouse movements
  moveSupportCursor(x, y) {
    this.rvSupportCursor.style.cssText =
      this.rvSupportCursor.style.cssText.replace('display: none;', 'display: block;');

    if (this.rvSupportCursor.style.cssText.indexOf('left') !== -1) {
      this.rvSupportCursor.style.cssText =
        this.rvSupportCursor.style.cssText.replace(/left:.*px;/, 'left: ' + x + 'px;');
      this.rvSupportCursor.style.cssText =
        this.rvSupportCursor.style.cssText.replace(/top:.*px;/, 'top: ' + y + 'px;');
    } else {
      this.rvSupportCursor.style.cssText += ' left: ' + x + 'px; top: ' + y + 'px;';
    }

    // 'display: none; position: absolute; z-index: '

    _$('#' + this.supportCursorId()).css({'display': 'block', 'left': x + 'px', 'top': y + 'px'});
  }

  // Append support button
  appendSupportButton() {
    this._docBody.append(this.rvSupportButton);
  }

  // Append support cursor
  appendSupportCursor() {
    this._docBody.append(this.rvSupportCursor);
  }

  // Remove support button
  removeSupportButton() {
    _$('#' + this.supportButtonId()).remove();
  }

  // Remove support cursor
  removeSupportCursor() {
    _$('#' + this.supportCursorId()).remove();
  }
}

export let rvDomElem = new RvDomElem();
