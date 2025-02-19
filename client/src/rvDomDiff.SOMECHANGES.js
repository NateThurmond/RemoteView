import jQuery from 'jquery';
const _$ = jQuery.noConflict(true);
/* import {rvDomElem} from './rvDomElem.js'; */
// window.jQuery = $;
// window.$ = $;

class RvDomDiff {
  constructor() {
    this._name = 'RvDomDiff';

    // Our most current dom representation
    this.vDomStorage = {};

    // Doms sent from client side
    this.deliveredDoms = [];

    // Prevent other parsing of dom diffs until the current diff is done
    this.domLocked = false;

    // Always process the first dom received for the support user
    this.initialLoad = false;

    // Lock used to prevent other functions from running while critical stuff is going on
    this.storageInProgress = false;

    // Used to make sure that processDomUpdates is only called once
    this.parsingCalled = false;

    // Used to process callBack within list iterate function
    this.iteratorTimer = null;

    // Function bindings
    this.domUpdate = this.domUpdate.bind(this);
    this.createElement = this.createElement.bind(this);
  }
  get name() {
    return this._name;
  }

  // Lock the dom since it is currently being update
  domLock() {
    this.domLocked = true;
  }

  // Unlock the dom for updates
  domUnlock() {
    this.domLocked = false;
  }

  /* When a click event happens for the support user, pause processing of future dom
  updates until the current dom updates are processed. After they are processed, store
  the current dom for comparison so that it contains any updated/new elements that were
  generated from the click */
  updateDomOnClick() {

    let obj = this;

    // this.updateDomFromClick = true;

    while (this.storageInProgress || this.domLocked || this.updateDomFromClick) {
      setTimeout(() => {
        obj.updateDomOnClick();
      }, 1);

      return;
    }

    this.updateDomFromClick = true;

    // this.updateDomFromClick = false;

    setTimeout(function () {

      try {

        let vDomToStore = obj.vDom();

        obj.vDomStorage = vDomToStore;

        obj.updateDomFromClick = false;
      } catch (e) {
        console.log(e);
        obj.updateDomFromClick = false;
      }

    }, 500);
  }

  // Reappend elements to the dom
  domUpdate(deliveredDomUpdate) {

    // As support user, make sure we have a dom diff to compare against
    if (!this.initialLoad) {
      return;
    }

    try {
      // Store the delivered dom update
      this.deliveredDoms.push(deliveredDomUpdate);

      // If parsing is occurring or waiting, dont run this function again
      if (!this.parsingCalled) {
        this.parseDomUpdates();
      }
    } catch (e) {
      console.log(e);
    }
  }

  parseDomUpdates() {

    let obj = this;

    // Lock this function from other parseDomUpdates calls
    this.parsingCalled = true;

    // If we are waiting on other functions call this function again on delay
    while (this.storageInProgress) {
      setTimeout(() => {
        obj.parseDomUpdates();
      }, 100);

      return;
    }

    for (let domUpdateInd in obj.deliveredDoms) {

      // Actual dom update
      let domUpdateParsed = obj.deliveredDoms[domUpdateInd]['domUpdate'];

      obj.storageInProgress = true;
      obj.domLock();

      // Get our current dom to compare against
      // obj.getDomDiff(true, function () {
      let prevDom = obj.vDomStorage;

      try {
        obj.deliveredDoms.splice(domUpdateInd, 1);
        obj.updateElement(_$('body'), domUpdateParsed, prevDom, 0, true);
        obj.vDomStorage = domUpdateParsed;
      } catch (e) {
        console.log(e);
        obj.domUnlock();
        obj.storageInProgress = false;
      }

      obj.domUnlock();
      obj.storageInProgress = false;
    // });
    }

    // Unlock this function
    this.parsingCalled = false;
  }

  // Function to iterate over dom elements and build out diff
  listIterate(elem, diffObj, cb) {
    let obj = this;

    diffObj['type'] = elem.prop('nodeName').toLowerCase();
    diffObj['attrs'] = {};
    diffObj['data'] = {};

    diffObj['data'] = _$(elem).data();

    if (_$.inArray(_$(elem).val(), ['undefined']) === -1) {
      diffObj['attrs']['val'] = _$(elem).val();
    }

    if (diffObj['type'] === 'canvas') {
      // This is best method to reliably capture all canvas data but relies on selectors
      // i.e. id and class names.
      let canvasElem = elem[0];

      let canvasElemId = elem.attr('id');

      let canvasElemClass = elem.attr('class');

      let cWidth = elem[0].width;

      let cHeight = elem[0].height;

      if (canvasElemId && canvasElemClass) {
        canvasElem = document.querySelectorAll('#' + canvasElemId + ',.' + canvasElemClass.replace(' ', ',.'))[0];
      } else if (canvasElemId) {
        canvasElem = document.getElementById(canvasElemId);
      } else if (canvasElemClass) {
        canvasElem = document.querySelectorAll('.' + canvasElemClass.replace(' ', ',.'))[0];
      }

      diffObj['data']['canvasData'] = {'height': cHeight, 'width': cWidth,
        'data': canvasElem.toDataURL()};
    }

    _$(elem).each(function () {
      _$.each(this.attributes, function () {
        if (this.specified) {
          diffObj['attrs'][this.name] = this.value;

          if (this.name === 'type' && this.value === 'checkbox') {
            diffObj['attrs']['checked'] = _$(elem).prop('checked');
          }
        }
      });
    });

    let childCounter = 0;

    elem.contents().each(function () {

      let foundNodeType = _$(this)[0].nodeType;

      let foundNodeName = _$(this)[0].nodeName;

      if (_$.inArray(foundNodeType, [8, 4, 7, 10, 12]) !== -1) {
        diffObj['children'][childCounter] = {'type': '#text', 'data': null, 'attrs': null, 'children': ['']};
      } else if (foundNodeType === 3 && foundNodeName === '#text') {
        diffObj['children'][childCounter] = {'type': '#text', 'data': null, 'attrs': null,
          'children': [_$(this)[0].data]};
      } else {
        diffObj['children'][childCounter] = {'type': null, 'data': null, 'attrs': null, 'children': []};
        obj.listIterate(_$(this), diffObj['children'][childCounter], cb);
      }

      childCounter++;
    });

    // Only call callback once when function is finally done
    clearTimeout(this.iteratorTimer);

    this.iteratorTimer = setTimeout(function () {
      cb();
    }, 100);
  }

  vDom(cb) {

    let obj = this;

    let bodyClone = _$('body').clone(true, true).off();

    // Special case for selects, clone does not copy these values for selects
    let selects = _$('body').find('select');

    _$(selects).each(function (i) {
      let select = this;

      bodyClone.find('select').eq(i).val(_$(select).val());
    });

    bodyClone.find('#remoteViewSupportRequestButton').remove();
    bodyClone.find('#remoteViewCursor').remove();
    bodyClone.find('script').remove();

    let vDomObj = {'type': null, 'data': null, 'attrs': null, 'children': []};

    // Added callback to remove any ambiguity for different processing events
    obj.listIterate(bodyClone, vDomObj, function () {
      cb(vDomObj);
    });
  }

  createElement(node) {
    let obj = this;

    if (typeof (node) === 'string') {
      return document.createTextNode(node);
    } else if (typeof (node.type) !== 'undefined' && node.type === '#text') {
      return document.createTextNode(node.children[0]);
    }

    const el = document.createElement(node.type);

    node.children
      .map(obj.createElement)
      .forEach(el.appendChild.bind(el));

    if (typeof (node.attrs) !== 'undefined') {
      obj.applyAttr(_$(el), node.attrs);
    }
    if (typeof (node.data) !== 'undefined') {
      obj.applyData(_$(el), node.data);
    }

    return el;
  }

  changed(node1, node2) {
    return typeof (node1) !== typeof (node2) ||
      typeof (node1) === 'string' && (node1) !== (node2) ||
      node1.type !== node2.type;
  }

  attrChanged(node1, node2) {
    if (typeof (node2.attrs) === 'undefined' && typeof (node1.attrs) === 'undefined') {
      return false;
    }

    return JSON.stringify(node1.attrs) !== JSON.stringify(node2.attrs);
  }

  dataChanged(node1, node2) {
    if (typeof (node2.data) === 'undefined' && typeof (node1.data) === 'undefined') {
      return false;
    }

    // If either item is a canvas, it is more efficient to just redraw than
    // determine if their is difference in canvas data
    if ((typeof (node1.type !== 'undefined') && node1.type === 'canvas') ||
      (typeof (node2.type !== 'undefined') && node2.type === 'canvas')) {
      node1['data']['oldCanvasData'] = node2['data']['canvasData'];
      return true;
    }

    return JSON.stringify(node1.data) !== JSON.stringify(node2.data);
  }

  applyAttr(elem, newAttrs) {
    // Remove previous attributes
    elem.each(function () {
      _$.each(this.attributes, function () {
        if (typeof (this) !== 'undefined') {
          elem.removeAttr(this.name);
        }
      });
    });

    if (newAttrs !== null && typeof (newAttrs) !== 'undefined') {
      if (typeof newAttrs['val'] !== 'undefined') {
        elem.val(newAttrs['val']);
        delete newAttrs['val'];
      }
      if (typeof newAttrs['checked'] !== 'undefined') {
        elem.prop('checked', newAttrs['checked']);
        delete newAttrs['checked'];
      }
    }

    elem.attr(newAttrs);
  }

  applyData(elem, newData) {
    if (newData === null || typeof (newData) === 'undefined') {
      elem.data({});
    } else {
      if (typeof newData['canvasData'] !== 'undefined') {

        if (typeof newData['oldCanvasData'] !== 'undefined') {
          // console.log('found old canvas');
          // console.log(newData);
          let oldImageData = newData['oldCanvasData']['data'];

          let imageData = newData['canvasData']['data'];

          console.log(oldImageData);

          /* mergeImages([oldImageData, imageData]).then(b64 => {
            let img = new Image();

            img.onload = function () {
              let ctx3 = elem[0].getContext('2d');

              ctx3.drawImage(img, 0, 0);
            };
            img.src = b64;
          }); */

          let oldImg = new Image();

          let img = new Image();

          oldImg.onload = function () {
            let ctx3 = elem[0].getContext('2d');

            ctx3.drawImage(oldImg, 0, 0);
            // ctx3.drawImage(img, 0, 0);

            img.onload = function () {
              ctx3.drawImage(img, 0, 0);
              // ctx3.drawImage(oldImg, 0, 0);

              setTimeout(function () {
                delete newData['oldCanvasData'];
                newData['canvasData']['data'] = elem[0].toDataURL();
                // elem.data(newData);
              }, 10);
              // elem.data(newData);
            };
            img.src = imageData;
            // img.src = oldImageData;
          };
          oldImg.src = oldImageData;
          // oldImg.src = imageDatai;
        } else {

          let imageData = newData['canvasData']['data'];

          // let cHeight = newData['canvasData']['height'];

          // let cWidth = newData['canvasData']['width'];

          let img = new Image();

          img.onload = function () {
            let ctx2 = elem[0].getContext('2d');

            ctx2.drawImage(img, 0, 0); // Or at whatever offset you like

            newData['oldCanvasData'] = newData['canvasData'];
            elem.data(newData);
          };
          img.src = imageData;
        }
      } else {
        elem.data(newData);
      }
    }
  }

  updateElement(parent, newNode, oldNode, index = 0, initialCall = false) {

    let obj = this;

    let foundNodeType = parent[0].nodeType;
    let foundNodeName = parent[0].nodeName;

    if (!initialCall) {
      if (_$.inArray(foundNodeType, [8, 4, 7, 10, 12]) !== -1 || (foundNodeType === 3 &&
        foundNodeName === '#text')) {

        parent = parent.parent();
      }
    }

    if (initialCall) {
      // Check attrs of body
      if (obj.attrChanged(newNode, oldNode)) {
        obj.applyAttr(_$('body'), newNode.attrs);
      }

      if (obj.dataChanged(newNode, oldNode)) {
        obj.applyData(_$('body'), newNode.data);
      }

      const newLength = newNode.children.length;

      const oldLength = oldNode.children.length;

      for (let i = 0; i < newLength || i < oldLength; i++) {
        obj.updateElement(
          _$('body'),
          newNode.children[i],
          oldNode.children[i],
          i
        );
      }
    } else if (!oldNode) {
      parent.append(_$(obj.createElement(newNode)));
    } else if (!newNode) {
      let elemToRemove = parent.contents().eq(index);

      if (elemToRemove.length > 0) {
        elemToRemove.remove();
      }
    } else if (obj.changed(newNode, oldNode)) {
      parent.contents().eq(index).replaceWith(_$(obj.createElement(newNode)));
    } else if (newNode.type) {

      if (obj.attrChanged(newNode, oldNode)) {
        obj.applyAttr(parent.contents().eq(index), newNode.attrs);
      }
      if (obj.dataChanged(newNode, oldNode)) {
        obj.applyData(parent.contents().eq(index), newNode.data);
      }

      const newLength = newNode.children.length;

      const oldLength = oldNode.children.length;

      for (let i = 0; i < newLength || i < oldLength; i++) {
        obj.updateElement(
          parent.contents().eq(index),
          newNode.children[i],
          oldNode.children[i],
          i
        );
      }
    }
  }

  // Function to calculate the Dom difference
  getDomDiff(justStore, callback) {

    // Don't process dom updates until the initial dom is stored from page load
    this.initialLoad = true;

    let obj = this;

    if (!this.domLocked || justStore) {

      // let prevDom = obj.vDomStorage;

      obj.vDom(function (vDomProcessed) {

        obj.vDomStorage = vDomProcessed;

        if (!justStore) {

          callback(obj.vDomStorage);
        } else {
          callback({});
        }
      });
    } else {
      callback({});
    }
  }
}

export let rvDomDiff = new RvDomDiff();
