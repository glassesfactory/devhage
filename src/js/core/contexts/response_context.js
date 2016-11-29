const ObjectHelper = require('../helpers/object');

export default class ResponseContext {

  constructor(options = {}) {

  }

  _setDefault(){
    this.url = null;
    this.baseURL = null;
    this.method = null;
    this.params = null;
    this.contentType = null;
    this.body = null;
  }

}
