import Entry from '../models/Entry'
import Signal from '../core/signal'
import Ikari from '../core/templates/ikari'
import tmpl from '../templates/side'

const TGT = 'js-sidebar-recent';

export default class SideList {

  get _tmpl() {
    let div = document.createElement("div");
    div.innerHTML = tmpl;
    return div.children[0];
  }

  constructor(){
    this._setupDefault();
    this._bind();
    this.tmpl = new Ikari({el:this._tmpl});
    this.tmpl.build();

  }

  /*
  */
  _setupDefault(){
    //

  }

  _bind(){
    Signal.subscribe("first_list", this._fetchedHandler.bind(this));
  }

  _fetchedHandler(signal, result){
    this.render(result);
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



  render(data){
    let elm;
    try{
      elm = this.tmpl.update({entries:data});
    } catch(error){
      console.log(error);
    }
    let doc = document;
    let tgt = doc.getElementById(TGT);
    if(tgt.children.length > 0){
        while(tgt.firstChild){tgt.removeChild(tgt.firstChild);}
      }
    tgt.appendChild(elm);
  }
}
