export default class Helper {
  constructor() {
    this._name = 'Image';
  }
  get name() {
    return this._name;
  }
  static defaultCursor() {
    // Default cursor image
    return 'data:image/png;base64,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' +
      'AAAElFTkSuQmCC';
  }
}
