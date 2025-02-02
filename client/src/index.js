import io from 'socket.io-client';
import $ from 'jquery';
import Helper from './helper.js';
import {rvDomDiff} from './rvDomDiff.js';
import {rvDomElem} from './rvDomElem.js';

// Our servers
let supportServer = 'http://nate.sytes.net:3001';

let clientServer = 'http://nate.sytes.net:3000';

let selectedServer = clientServer;

// Socket connection, initialized when user clicks button for support
let socket = null;

// Support user id, passed as url parameter
let supportUserId = '';

// Passed client Id used to establish connection
let passedClientId = '';

// If passed reconnect session
let reconnectSupport = 'false';

// Current mouse coordinates
let current = {};

// Is this a support or client session?
let supportUser = false;

// Check for redirection of page
let redirectClientView = false;

// Get a unique id to distinguish connections from our server
let clientId = Helper.uniqueId();

// Timer for getting dom diffs, cleared when disconnect
let domDiffTimer = null;

// keep track of whether the mouse is being held down
let mouseDown = false;

// Keep track of last canvas position from support user when drawing
let lastCanvasPos = [];

// Timer to fire mouseup event after 1/2 sec after canvas movement has stopped
let lastDrawTimer = null;

// Boolean indicating whether this was accessed from mobile or not
let rvIsMobile = Helper.detectMobile();

// send mouse coordinates to our server
function mouseMovementEmit(x0, y0, x1, y1, emit) {

  if (!emit) { return; }

  // Transmit scroll offset as well to determine mouse position;
  let w = window.pageXOffset;
  let h = window.pageYOffset;

  socket.compress(true).emit('mouseMovement', {
    x0: x0,
    y0: y0,
    x1: x1,
    y1: y1,
    w: w,
    h: h,
    mouseDown: mouseDown
  });
}

// send mouse coordinates while drawing on canvas to our server
function mouseMovementEmitCanvas(x0, y0, x1, y1, emit) {

  if (!emit) { return; }

  // Transmit scroll offset as well to determine mouse position;
  let w = window.pageXOffset;
  let h = window.pageYOffset;

  socket.compress(true).emit('canvasData', {
    x0: x0,
    y0: y0,
    x1: x1,
    y1: y1,
    w: w,
    h: h,
    mouseDown: mouseDown
  });
}

function onMouseDown(e) {
  mouseDown = true;
  current.x = e.clientX;
  current.y = e.clientY;
  current.w = window.pageXOffset;
  current.h = window.pageYOffset;
  socket.compress(true).emit('leftClick', current);

  // For the support user, store the updated dom to prevent update loop when
  // transferring click event to the client
  // if (supportUser) {
  // e.preventDefault();
  // rvDomDiff.updateDomOnClick();
  // }
}

function onMouseUp(_e) {
  mouseDown = false;

  // drawing = false;
  // mouseMovementEmit(current.x, current.y, _e.clientX, _e.clientY, true);
}

function onMouseMove(e) {
  mouseMovementEmit(current.x, current.y, e.clientX, e.clientY, true);
  current.x = e.clientX;
  current.y = e.clientY;

  // The support user is drawing on a canvas
  if (supportUser && mouseDown && e.target.nodeName === 'CANVAS') {
    mouseMovementEmitCanvas(current.x, current.y, e.clientX, e.clientY, true);
  }
}

// Function to update coordinates when window size is adjusted, only sent to support user
function onResize() {
  if (!supportUser) {
    socket.compress(true).emit('resize', {'windowInnerWidth': window.innerWidth,
      'windowInnerHeight': window.innerHeight, 'windowOuterWidth': window.outerWidth,
      'windowOuterHeight': window.outerHeight, 'htmlWidth': $('html').width(),
      'htmlHeight': $('html').height()});
  }
}

// Function to register mouse movents
function mouseMovementReceive(data) {
  // Move support cursor to indicate other user mouse movement
  rvDomElem.moveSupportCursor(
    (parseInt(data.x1, 10) + parseInt(data.w, 10) - parseInt(window.pageXOffset, 10)),
    (parseInt(data.y1, 10) + parseInt(data.h, 10) - parseInt(window.pageYOffset, 10))
  );
}

// Function to transmit touch event
function sendTouchEvent(x, y, element, eventType) {
  const touchObj = new Touch({
    identifier: Date.now(),
    target: element,
    clientX: x,
    clientY: y,
    radiusX: 2.5,
    radiusY: 2.5,
    rotationAngle: 10,
    force: 0.5
  });

  const touchEvent = new TouchEvent(eventType, {
    cancelable: true,
    bubbles: true,
    touches: [touchObj],
    targetTouches: [],
    changedTouches: [touchObj],
    shiftKey: false
  });

  element.dispatchEvent(touchEvent);
}

// Function to listen for drawing on canvas (from support user) and draw on client canvas
function mouseMovementReceiveCanvas(data) {

  // Make sure the support user is actively drawing on the canvas (mouse down)
  if (data.mouseDown && !supportUser) {
    // Determine the coordinates the support user is drag selecting on
    let calcXCanvas = parseInt(data.x1, 10) + parseInt(data.w, 10) - parseInt(window.pageXOffset, 10);

    let calcYCanvas = parseInt(data.y1, 10) + parseInt(data.h, 10) - parseInt(window.pageYOffset, 10);

    // Briefly hide the mouse cursor to pick up element underneath
    rvDomElem.toggleSupportCursor(false);

    // Determine what element the user is scrolling on
    let elemRemoteScroll = document.elementFromPoint(parseInt(calcXCanvas, 10),
      parseInt(calcYCanvas, 10));

    // Reshow support cursor now that we have determined the element underneath
    rvDomElem.toggleSupportCursor(true);

    if (elemRemoteScroll !== null && elemRemoteScroll.nodeName === 'CANVAS') {

      // Clear timeout that registers the last mouse movement (mouse up)
      clearTimeout(lastDrawTimer);

      // Generate js event
      let myCanvasEvent = document.createEvent('Event');

      // Set data in event
      myCanvasEvent.clientX = data.x1;
      myCanvasEvent.clientY = data.y1;

      // Wait 1/2 second then fire the mouse up event if no further data is coming
      lastDrawTimer = setTimeout(function () {
        lastCanvasPos = [];
        if (!rvIsMobile) {
          myCanvasEvent.initEvent('mouseup', false, true);
          elemRemoteScroll.dispatchEvent(myCanvasEvent);
        } else {
          sendTouchEvent(myCanvasEvent.clientX, myCanvasEvent.clientY, elemRemoteScroll, 'touchend');
        }
      }, 500);

      // If first event trigger mousedown, otherwise trigger mousemove
      if (lastCanvasPos.length === 0) {
        if (rvIsMobile) {
          sendTouchEvent(myCanvasEvent.clientX, myCanvasEvent.clientY, elemRemoteScroll, 'touchstart');
        } else {
          myCanvasEvent.initEvent('mousedown', false, true);
          elemRemoteScroll.dispatchEvent(myCanvasEvent);
        }
      } else {
        if (rvIsMobile) {
          sendTouchEvent(myCanvasEvent.clientX, myCanvasEvent.clientY, elemRemoteScroll, 'touchmove');
        } else {
          myCanvasEvent.initEvent('mousemove', false, true);
          elemRemoteScroll.dispatchEvent(myCanvasEvent);
        }
      }

      // Set the last canvas position to this x,y coord for next iteration
      lastCanvasPos = [data.x1, data.y1];
    }
  }
}

// Disconnect from our server
function remoteViewDisconnect() {

  if (supportUser) {
    // Send disconnect
    socket.compress(true).emit('disconnectSupport', {'supportUser_Id': supportUserId});

    // Clear screen for support user on disconnect
    $('html').empty();
  } else {
    // Send disconnect
    socket.compress(true).emit('disconnectClient', {'clientId': clientId});
  }

  // Session ended, delete client cookie
  Helper.eraseCookie('remoteViewCookie');

  // Disconnect client end of socket
  socket.disconnect();

  // Set support button and cursor to default (disabled and hidden)
  rvDomElem.toggleSupportButton(false);
  rvDomElem.toggleSupportCursor(false);

  // Remove event listeners
  document.removeEventListener('mousedown', onMouseDown, {passive: false});
  document.removeEventListener('mouseup', onMouseUp, {passive: false});
  document.removeEventListener('mouseout', onMouseUp, {passive: false});
  document.removeEventListener('mousemove', Helper.throttle(onMouseMove, 10), {passive: false});
  document.removeEventListener('touchstart', onMouseDown, {passive: false});
  document.removeEventListener('touchend', onMouseUp, {passive: false});
  document.removeEventListener('touchend', onMouseUp, {passive: false});
  document.removeEventListener('touchmove', Helper.throttle(onMouseMove, 10), {passive: false});
  window.removeEventListener('resize', Helper.throttleLastCall(onResize, 1000), true);

  // Clear timeout for dom diff watcher
  clearTimeout(domDiffTimer);
}

// Function to transmit dom updates
function remoteViewDomUpdate(updatedDom) {
  if (!($.isEmptyObject(updatedDom)) && socket !== null) {
    if (supportUser) {
      // CURRENTLY ONLY TRANSFERRING DOM UPDATES FROM CLIENT TO SUPPORT
      // MAY CHANGE BACK LATER
      // socket.compress(true).emit('domUpdate',
      //  {'domUpdate': JSON.stringify(updatedDom)});
    } else {
      socket.compress(true).emit('domUpdate',
        {'domUpdate': updatedDom});
    }
  }
}

// Connect to our server for remote support
function remoteViewConnect() {

  // Set cookie for client so that moving to another page reconnects session
  if (!supportUser) {
    Helper.setCookie('remoteViewCookie', clientId, 1);
  }

  // Determine if we need to use ? or & for url separator of connect time
  // Not in use currently but can be used to pass custom args in url in future
  // let argSeparator = (document.URL.indexOf('?') !== -1) ? '&' : '?';

  // Initial data sent on connection
  let handShakeData = (supportUser) ? {query: 'supportUser_Id=' + supportUserId + '&endUserId=' + passedClientId +
    '&reconnect=' + reconnectSupport} :
    {query: 'clientId=' + clientId + '&documentUrl=' +
    encodeURIComponent(document.URL) +
    '&redirectClientView=' + redirectClientView};

  // Create socket and send initial data
  socket = io(selectedServer, handShakeData);

  // Add event listeners
  // Third argument here specified callback function to fire after event bubbling
  document.addEventListener('mousedown', onMouseDown, {passive: false});
  document.addEventListener('mouseup', onMouseUp, {passive: false});
  document.addEventListener('mouseout', onMouseUp, {passive: false});
  document.addEventListener('mousemove', Helper.throttle(onMouseMove, 10), {passive: false});
  document.addEventListener('touchstart', onMouseDown, {passive: false});
  document.addEventListener('touchend', onMouseUp, {passive: false});
  document.addEventListener('touchend', onMouseUp, {passive: false});
  document.addEventListener('touchmove', Helper.throttle(onMouseMove, 10), {passive: false});
  window.addEventListener('resize', Helper.throttleLastCall(onResize, 1000), true);

  // Set watcher for dom updates - POSSIBLE PUT THIS SOMEWHERE ELSE
  // RIGHT NOW ONLY PROCESSING DOM DIFFS FOR SUPPORT USER
  if (!supportUser) {
    domDiffTimer = setInterval(function () {

      rvDomDiff.getDomDiff(false, function (vDom) {
        remoteViewDomUpdate(vDom);
      });

    }, 1000);
  } else {
    // Support user is connected, send signal to end user that connection is established
    socket.compress(true).emit('supportConnected', {'connected': true});
  }

  socket.on('mouseMovement', mouseMovementReceive);

  if (!supportUser) {
    socket.on('canvasData', mouseMovementReceiveCanvas);
  }

  // If server sends disconnect, cancel support and reset button
  socket.on('disconnect', function () {
    if (socket.id !== null && socket.id !== 'undefined' && typeof (socket.id) !== 'undefined') {
      remoteViewDisconnect();
      alert('Support Session Ended');
      clearTimeout(domDiffTimer);
    }
  });

  // Perform some actions when message is first received that support user is connected (only received by client)
  socket.on('supportConnected', function (_supportConnMessage) {
    if (!supportUser) {
      // First signal came back from support user after they connected,
      // send resize coordinates for support user to pick up on to adjust their view
      onResize();
    }
  });

  // Connected user clicked, emulate click here and show that action by tilting cursor
  socket.on('leftClick', function (clickCoord) {

    // Briefly hide the mouse cursor to pick up element underneath
    rvDomElem.toggleSupportCursor(false);

    // Determine the click coordinates using scroll ofset and the window coordinates for the mouse click
    let calcX = parseInt(clickCoord.x, 10) + parseInt(clickCoord.w, 10) - parseInt(window.pageXOffset, 10);

    let calcY = parseInt(clickCoord.y, 10) + parseInt(clickCoord.h, 10) - parseInt(window.pageYOffset, 10);

    // Determine what element is under the click
    let elemRemoteClick = document.elementFromPoint(parseInt(calcX, 10),
      parseInt(calcY, 10));

    // Simulate click and focus on element
    if (elemRemoteClick !== null) {
      // CURRENTLY SET TO ONLY REGISTER CLICKS FROM CLIENT -> SUPPORT, MAY CHANGE LATER
      if (!supportUser) {
        if (rvIsMobile) {
          // canvas events are handled through separate data
          if (elemRemoteClick.nodeName !== 'CANVAS') {
            elemRemoteClick.click();
          }
        } else {
          elemRemoteClick.click();
        }
      }
      elemRemoteClick.focus();
    }

    // Reshow the cursor now that we have simulated click on element underneath
    rvDomElem.toggleSupportCursor(true);

    // Tilt support cursor briefly to indicate other user left click
    rvDomElem.tiltSupportCursor();
  });

  // When client resizes window, adjust support view to same size
  socket.on('resize', function (windowDim) {
    $('html').css('width', windowDim.windowInnerWidth + 'px');
    $('html').css('height', windowDim.windowInnerHeight + 'px');
  });

  // When receiving dom updates pass to function to apply them
  socket.on('domUpdate', rvDomDiff.domUpdate);
}

// Handler for user request button
function supportButtonClick(_e) {

  if (supportUser) {
    // Support user only has the option to disconnect and only once
    remoteViewDisconnect();

    // Remove support button and cursor
    rvDomElem.removeSupportButton();
    rvDomElem.removeSupportCursor();
  } else {
    // if ($('#remoteViewSupportRequestButton').html() === 'Disable Remote View') {
    if (rvDomElem.supportButtonActive()) {
      remoteViewDisconnect();

      // Set the support back to default/disabled
      rvDomElem.toggleSupportButton(false);
    } else {
      remoteViewConnect();

      // Set the support button to showing that it is active
      rvDomElem.toggleSupportButton(true);
    }
  }
}

// Start app after document is ready
function startApp() {

  // Only run after DOM is loaded
  document.addEventListener('DOMContentLoaded', () => {

    // Check if this is a support user session
    supportUserId = Helper.getUrlParameter('supportUser_Id');
    passedClientId = Helper.getUrlParameter('endUser_Id');
    reconnectSupport = Helper.getUrlParameter('reconnect');
    supportUser = ($.inArray(supportUserId, ['', 'null', null]) === -1 && passedClientId !== '');

    // Create reference to document body
    rvDomElem.docBody($('body'));

    // Create the support button and cursor
    rvDomElem.createSupportButton();
    rvDomElem.createSupportCursor();

    // If support user
    if (supportUser) {
      // Set support server, auto connect for support user
      selectedServer = supportServer;
      remoteViewConnect();
      rvDomElem.toggleSupportButton(true);
    } else {
      // Set client server, make sure button is disabled by default
      selectedServer = clientServer;
      rvDomElem.toggleSupportButton(false);

      // If previous cookie exists, page was redirected while in session, auto-connect
      let prevCookie = Helper.getCookie('remoteViewCookie');

      if (prevCookie !== null) {
        clientId = prevCookie;
        redirectClientView = true;
      }
    }

    // On page load, just store initial dom
    setTimeout(function () {
      rvDomDiff.getDomDiff(true, function (justStoreResp) {
        console.log(justStoreResp);
      });
    }, 1000);

    // Add buttons and cursors to dom needed for remote support
    rvDomElem.appendSupportButton();
    rvDomElem.appendSupportCursor();

    // Add listener for support button click
    $('#' + rvDomElem.supportButtonId()).on('mousedown', supportButtonClick);

    // If cookie was previously set launch remote view and send signal to update support view
    if (redirectClientView) {
      console.log('redirecting support user to new page');
      supportButtonClick({});

      // Send resize event with enough delay for support user to load new page
      setTimeout(function () {
        onResize();
      }, 1500);
    }

    // Prevent support users from redirecting page, page redirect will bubble from
    // simulated click in client and relocate anyways
    /* if (supportUser && reconnectSupport === 'false') {
      window.onbeforeunload = function () {
        return 'Waiting for client page to redirect, click okay';
      };
    } */
  });
}

startApp();
