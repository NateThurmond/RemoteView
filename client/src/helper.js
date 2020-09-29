export default class Helper {
  constructor() {
    this._name = 'Helper';
    this.resizeClearer;
  }
  get name() {
    return this._name;
  }

  // Generate a semi-random uuid (random enough for now)
  static uniqueId() {
    function s4() {
      return Math.floor((1 + Math.random()) * 0x10000)
        .toString(16)
        .substring(1);
    }
    return s4() + s4() + '-' + s4() + '-' + s4() + '-' + s4() + '-' + s4() + s4() + s4();
  }

  // Function to parse url parameters
  static getUrlParameter(sParam) {
    let sPageURL = decodeURIComponent(window.location.search.substring(1)),
      sURLVariables = sPageURL.split('&'),
      sParameterName,
      i;

    for (i = 0; i < sURLVariables.length; i++) {
      sParameterName = sURLVariables[i].split('=');

      if (sParameterName[0] === sParam) {
        return sParameterName[1] === undefined ? true : sParameterName[1];
      }
    }
    return '';
  }

  // Function to set a cookie, used now for determining page redirects
  static setCookie(name, value, days) {
    let expires = '';

    let remoteViewDomain = window.location.hostname;

    /* if (remoteViewDomain !== 'localhost') {
      remoteViewDomain = '.' + remoteViewDomain;
    }*/

    if (days) {
      let expireDate = new Date();

      expireDate.setTime(expireDate.getTime() + (days * 24 * 60 * 60 * 1000));
      expires = '; expires=' + expireDate.toUTCString();
    }

    document.cookie = name + '=' + (value || '') + expires + '; domain=' +
      remoteViewDomain + '; path=/';
  }

  static getAllCookies() {
    let allCookies = document.cookie.split(';');

    let allCookiesObj = {};

    for (let i = 1; i <= allCookies.length; i++) {
      let fullCookie = allCookies[i - 1].trim();

      allCookiesObj[fullCookie.split('=')[0].trim()] = fullCookie.split('=')[1];
    }
    return allCookiesObj;
  }

  // Function to get cookie by name
  static getCookie(name) {
    let nameEQ = name + '=';

    let ca = document.cookie.split(';');

    for (let i = 0; i < ca.length; i++) {
      let c = ca[i];

      while (c.charAt(0) === ' ') {
        c = c.substring(1, c.length);
      }
      if (c.indexOf(nameEQ) === 0) return c.substring(nameEQ.length, c.length);
    }
    return null;
  }

  // Function to erase cookie
  static eraseCookie(name) {
    let expiryDate = new Date();

    let cookieString = '';

    expiryDate.setTime(expiryDate.getTime() - 86400 * 1000);
    cookieString += ';max-age=0';
    cookieString += ';expires=' + expiryDate.toUTCString();
    cookieString += ';path=/';
    document.cookie = name + '=' + cookieString;
  }

  // Limit the number of events per second
  static throttle(callback, delay) {
    let previousCall = new Date().getTime();

    return function () {
      let time = new Date().getTime();

      if ((time - previousCall) >= delay) {
        previousCall = time;
        callback.apply(null, arguments);
      }
    };
  }

  // Only capture last event
  static throttleLastCall(callback, delay) {

    return function () {

      clearTimeout(Helper.resizeClearer);

      Helper.resizeClearer = setTimeout(function () {
        callback.apply(null, arguments);
      }, delay);
    };
  }

  // Detect if mobile or not
  static detectMobile() {
    if (/Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)) {
      return true;
    }
    return false;
  }
}
