import Entry from '../models/Entry'
import Signal from '../core/signal'
import Ikari from '../core/templates/ikari'
import tmpl from '../templates/entry'

const TGT = 'js-content'

export default class EntryList {

  get _tmpl() {
    let div = document.createElement("div");
    div.innerHTML = tmpl;
    return div.children[0];
  }

  constructor(){
    this._setupDefault();
    this._bind();
    this.tmpl = new Ikari({el:this._tmpl, helpers:{
      toDate:this.toDate,
      log:this.log
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

  _bind(){
    Signal.subscribe("detail_fetch", this._fetchedHandler.bind(this));
  }

  _fetchedHandler(signal, result){
    this._clearDom();
    this.render(result);
  }



  _clearDom(){
    let doc = document;
    let tgt = doc.getElementById(TGT);
    if(tgt.children.length > 0){
      while(tgt.firstChild){tgt.removeChild(tgt.firstChild);}
    }
  }

  toDate(date){
    date = new Date(date)
    let year = date.getFullYear()
    let month = date.getMonth()
    let day = date.getDate()
    let hour = ("0" + date.getHours()).slice(-2)
    let min = ("0" + date.getMinutes()).slice(-2)
    return year + "/" + month + "/" + day + " " + hour + ":" + min
  }



  render(data){
    let elm;
    try{
      elm = this.tmpl.update({entry:data});
    }catch(error){
      console.log(error);
    }
    let doc = document;
    let tgt = doc.getElementById(TGT);
    tgt.appendChild(elm);
  }
}