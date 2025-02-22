import jQuery from 'jquery';
import Image from './image.js';

const _$ = jQuery.noConflict(true);

class RvDomElem {
  constructor() {
    this._name = 'RvDomElem';

    this._docBody = null;

    this.rvSupportButton = null;
    this._supportButtonId = 'remoteViewSupportRequestButton';
    // Off/On Phone/X - See also &#128222; (phone) &#128187; (pc monitor) &#128488; (Speech Bubble)
    this.rvSupportButtonTexts = ["&#128222;", "&#10005;"];
    this.rvSupportButtonTitles = ["Help and support", "Disable Remote View"];

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
    let buttonUnicode = "&#" + _$('#' + this.supportButtonId())[0].textContent.codePointAt(0) + ";";
    return buttonUnicode === this.rvSupportButtonTexts[1];
  }

  docBody(bodyElem) {
    this._docBody = bodyElem;
  }

  // Create the support button with whatever initial parameters are best
  createSupportButton() {
    this.rvSupportButton = document.createElement('div');
    this.rvSupportButton.title = this.rvSupportButtonTitles[0];
    this.rvSupportButton.id = this.supportButtonId();
    this.rvSupportButton.className = 'rv-support-button';
    this.rvSupportButton.style.cssText = `
      z-index: 999999;
      position: fixed;
      bottom: 20px;
      right: 20px;
      width: 40px;
      height: 40px;
      background: #007BFF;
      color: white;
      font-size: 24px;
      text-align: center;
      line-height: 40px;
      border-radius: 50%;
      box-shadow: 0px 4px 6px rgba(0, 0, 0, 0.1);
      cursor: pointer;
      user-select: none;
      transition: background 0.2s ease-in-out;
    `;
    this.rvSupportButton.innerHTML = this.rvSupportButtonTexts[0]; // Default phone icon

    this.rvSupportButton.addEventListener("mouseenter", function () {
      this.style.background = "#0056b3"; // Darker blue on hover
    });
    this.rvSupportButton.addEventListener("mouseleave", function () {
      this.style.background = "#007BFF"; // Revert to original color
    });
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
    if (onOffBool !== '') {
      let suppButtonMode = (onOffBool === true) ? 1 : 0;
      let suppButtonIcon = this.rvSupportButtonTexts[suppButtonMode];
      let suppButtonTitle = this.rvSupportButtonTitles[suppButtonMode];

      this.rvSupportButton.innerHTML = suppButtonIcon;
      this.rvSupportButton.title = suppButtonTitle;
      _$('#' + this.supportButtonId()).html(suppButtonIcon);
      _$('#' + this.supportButtonId()).attr('title', suppButtonTitle);
    }
  }

  // Toggle support cursor to showing or not showing
  toggleSupportCursor(onOffBool = '') {
    if (onOffBool !== '') {
      let supportCursorDisplayInd = (onOffBool === true) ? 1 : 0;
      let supportCursorDisplay = this.rvSupportCursorDisplays[supportCursorDisplayInd];
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
