/* global describe, it, before */

import chai from 'chai';
import {DomStorage} from '../lib/remoteView.js';

chai.expect();

const expect = chai.expect;

let lib;

describe('Given an instance of my DomStorage library', () => {
  before(() => {
    lib = new DomStorage();
  });
  describe('when I need the name', () => {
    it('should return the name', () => {
      expect(lib.name).to.be.equal('DomStorage');
    });
  });
});
