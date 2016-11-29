const ObjectHelper = require('../helpers/object');

export default class RequestContext {

  constructor(options){
    if(!options){ options = {}}
    this._setDefault();
    this.fromObject(options);
  }

  _setDefault(){
    this.url = null;
    this.baseURL = null;
    this.method = null;
    this.params = null;
    this.contentType = null;
    this.cb = null;
  }

  fromObject(options){
    this.url = ObjectHelper.kv('url', options);
    this.method = ObjectHelper.kv('method', options);
    this.params = ObjectHelper.kv('params', options);
  }
}
