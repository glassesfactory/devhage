import Config from "./config"
import Dom from "./dom"
import Event from "./event"
import utils from "./utils"


export default class Builder {



  /**
    HTML バインドしてきてなんかする
    @class Builder
  */
  constructor(el, vm){
    this._setupDefault();
    this.el = utils.query(el);
    this.funcStr = ["var p = [];p.push.apply(p,arguments);"];
    this.args = [];
    this.ignores = [];
  }

  _setupDefault(){
    this.el = null;
    this.funcStr = [];
    this.args = null;
    this.ignores = null;
    this.incrementer = 0;
  }


  /**
    ビルドを実行する
    @method build
    @param vm {Ikari}
  */
  build(vm){
    let dom = this._parseElment(this.el, vm);
    this._build(dom, this.funcStr, vm);
  }


  /**
    エレメントをパースする
    @method _parseElement
    @private
    @param el {Node}
    @param vm {Ikari}
    @param parent {Dom}
    @return {Dom}
  */
  _parseElment(el, vm, parent){
    let dom = new Dom(el, vm)
    if(parent){
      parent.children.push(dom);
      dom.parent = parent;
    } else {
      dom.isContainer = true;
      this.container = dom;
    }
    let children = el.childNodes;
    this.args = dom.bind(this.args, this.ignores, parent);
    for(let i=0; i < children.length; i++){
      let child = children[i];
      this._parseElment(child, vm, dom);
    }
    return dom;
  }


  /**
    ビルドを実行する
    @method _build
    @private
    @param dom {Dom}
    @param funcStrs {Array}
    @param vm {Ikari}
  */
  _build(dom, funcStrs, vm){
    dom.build(funcStrs);
    funcStrs.push('return p.join("");');
    let str = funcStrs.join("");
    let args = [].concat( this.args );
    args.push(str);
    vm.compiler = new Function( str );
    vm.isBuilded = true;
    if(vm.cachable){
      localStorage.setItem(vm.compilerCacheName, args);
    }
    // #event 出す
    vm.emit(new Event(Event.BUILDED));
  }
}
