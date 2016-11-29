import Entry from '../models/Entry'
import Signal from '../core/signal'
import Ikari from '../core/templates/ikari'
import tmpl from '../templates/paginator'
const Config = require('../../../config.json');

const TGT = 'js-paginator'

export default class EntryList {

  get _tmpl() {
    let div = document.createElement("div");
    div.innerHTML = tmpl;
    return div.children[0];
  }

  constructor(){
    this._setupDefault();
    this._bind();
    let getKlass = this._getKlass.bind(this);
    this.tmpl = new Ikari({el:this._tmpl, helpers:{
      getKlass: getKlass
    }});
    this.tmpl.build();
  }

  log(tgt){
    console.log(tgt);
  }

  /*
  */
  _setupDefault(){
    //

  }

  _getKlass(num){
    if(num == this.current){
      return "paginator-entry current"
    }
    return "paginator-entry"
  }

  _bind(){
    Signal.subscribe("list_fetch", this._fetchedHandler.bind(this));
  }

  _fetchedHandler(signal, res){
    this._clearDom();
    this.render(res[0], res[1]);
    this._bindHandler();
  }

  _bindHandler(){
    let doc = document;
    let tgt = doc.getElementById(TGT);
    let els = tgt.getElementsByClassName('js-ps-change');
    for(let i = 0; i < els.length; i++){
      let elm = els[i];
      elm.removeEventListener('click', window.router._clickHandler);
      elm.addEventListener('click', window.router._clickHandler);
    }
  }

  _clearDom(){
    let doc = document;
    let tgt = doc.getElementById(TGT);
    if(tgt.children.length > 0){
      while(tgt.firstChild){tgt.removeChild(tgt.firstChild);}
    }
  }

  render(data, page){
    let elm;
    page = parseInt(page);
    this.current = page;
    let limit = Config.limit;
    // to config
    if(Entry.count < (limit + 1)){
      return;
    }
    try{
      let prev = null;
      let next = null;
      if(page > 1){
        prev = page - 1;
      }
      if(!Entry.count) {
        Entry.count = Entry.collection.length;
      }
      let maxPage = Entry.count / limit;

      if(Entry.count % limit > 0 && Entry.count > limit){
        maxPage = parseInt(maxPage) + 1;
      }
      if(maxPage != page && maxPage > page){
        next = page + 1;
      } else {
        next = null;
      }
      elm = this.tmpl.update({next:next, prev: prev});
    } catch(error){
      console.log(error);
    }

    let doc = document;
    let tgt = doc.getElementById(TGT);
    if(!elm || elm === 'undefined'||!tgt) {
      return;
    }
    tgt.appendChild(elm);
  }
}
