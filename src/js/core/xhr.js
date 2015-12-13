let Emitter = require('./emitter');
// require './utils.coffee'
const RequestContext = require('./contexts/request_context');
const ResponseContext = require('./contexts/response_context');
const MemStore = require('./store/mem_store');

let parseXML = (data)=> {

  if (window.DOMParser) {
    var xmlDoc;
    var parser = new DOMParser();

    try {
      xmlDoc = parser.parseFromString(data,"text/xml");
    } catch(error) {
      console.log(error);
    }
  }else {
    xmlDoc = new ActiveXObject("Microsoft.XMLDOM");
    xmlDoc.async = false;
    xmlDoc.loadXML(data);
  }
  return xmlDoc;
}

export default class XHR2 {
  static get(url) {
    let reqCtx = new RequestContext({
      url: url,
      method: "get"
    });
    return new XHR2Core(reqCtx);
  }

  static getHtml(url) {
    let reqCtx = new RequestContext({
      url: url,
      method: "get",
      params: {
        html: true
      }
    });
    return new XHR2Core(reqCtx)
  }

  static getXML(url) {
    let reqCtx = new RequestContext({
      url: url,
      method: "get",
      params: {
        xml: true
      }
    });
    return new XHR2Core(reqCtx);
  }
}

class XHR2Core extends Emitter {

  constructor(req) {
    super();
    this._setDefault();
    this.req = req;
    if(req.url.indexOf('?') < 0 && MemStore.get('in_preview')) {
      this.req.url = this.req.url + MemStore.get('stg_param');
    }
    this.xhr = this._createXHR();
  }

  // デフォルト
  _setDefault() {
    this.isXDR = false;
    this.errorHandler = null;
    this.successHandler = null;
    this.status = null;
    this.xhr = null;
  }


  end (cb) {
    if(!cb)
      return
    this.req.cb = cb;
    this.execute();
    return
  }

  execute(){
    let xhr = this.xhr;

    if (!this.isXDR) {
      xhr.open(this.req.method, this.req.url, true);
      let cb = this.cb;
      let _this = this;
      xhr.onreadystatechange = ()=> {
        if(xhr.readyState == 4) {
          cb.call(_this, xhr);
        }
        return;
      }
    } else {
      xhr.open(this.req.method, this.req.url);
      xhr.onprogress = ()=>{}
      xhr.ontimeout = ()=> {
        console.log("timeout error...");
        return;
      }
      xhr.onload = ()=> {
        this.emit({type:'success'});
        res = new ResponseContext();
        try{
          if(this.req.params && this.req.params.html) {
            res.body = xhr.responseText;
          } else if(this.req.params && this.req.params.xml) {
            res.body = parseXML(xhr.responseText);
          } else {
            res.body = JSON.parse(xhr.responseText);
          }
          this.req.cb(null, res);
        } catch(error) {
          err = {
            status: xhr.status,
            msg: "構文エラー",
            url: this.req.url
          }
          this.req.cb(err, res);
        }
        return;
      }
      xhr.onerror = ()=>{
        this.emit({type:'error'});
        let err = {
          status: xhr.status,
          msg: xhr.responseText
        }
        this.req.cb(err, null);
        this.destroy();
        return;
      }
    }
    xhr.send();
    return;
  }

  cb(xhr) {
    this.status = xhr.status;
    if (xhr.status == 200 || xhr.status == 304) {
      this.emit({type:'success'});
      let res = new ResponseContext();
      try {
        // HTMLパーツをリクエストしたときはJSONパーサに通さず返す
        if(this.req.params && this.req.params.html) {
          res.body = xhr.responseText;
        } else if(this.req.params && this.req.params.xml) {
          rb = xhr.responseXML;
          if(rb === null) {
            rb = parseXML(xhr.responseText);
          }
          res.body = rb;
        } else {
          res.body = JSON.parse(xhr.responseText);
        }
        this.req.cb(null, res);
      } catch(error){
        console.log(error);
        let err = {
          status: xhr.status,
          msg: "構文エラー",
          url: this.req.url
        }
        this.req.cb(err, res);
      }
      return;
    } else {
      this.emit({type:'error'});
      let msg = "えらー";
      if(xhr.status === "404") {
        msg = this.req.url + "is not found...";
      }
      let err = {
        status: xhr.status,
        msg: msg
      };
      this.req.cb(err, null);
      return;
    }
    return;
  }

  /**
    XHR を作成する
    @method _createXHR
    @private
  */
  _createXHR() {
    if(window.XDomainRequest && this.req.url.indexOf('http') > -1) {
      this.isXDR = true;
      return new XDomainRequest();
    } else if(window.XMLHttpRequest) {
      return new XMLHttpRequest();
    } else if(window.ActiveXObject) {
      try{
        return new ActiveXObject("Msxml2.XMLHTTP");
      }catch(e) {
        try {
          return new ActiveXObject("Microsoft.XMLHTTP");
        } catch( e ) {
          return null;
        }
      }
    }else{
      return null;
    }
    return;
  }


  /*
    インスタンスを破棄する
  */
  destroy() {
    this.xhr = null;
    this.req = null;
    return;
  }
}

module.exports = XHR2
