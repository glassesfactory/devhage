import utils from "./ikari/utils"
import Config  from "./ikari/config"
import Builder from "./ikari/builder"
import escaper from "./ikari/escaper"
import Emitter from "./ikari/emitter"
import Event from "./ikari/event"

const INPUTS = ["input", "textarea", "select", "hidden"];

export default class Ikari extends Emitter {


  /**
    Simple HTML Binding Template Engine.
    @class Ikari
    @param options {Object}
  */
  constructor(options){
    super()
    if(!options){
      options = {};
    }
    this._setDefault();
    let el = utils.kv("el", options);
    this.datas = utils.kv("datas", options);
    this.autoBuild = utils.kv("autoBuild", options, false);
    let data  = utils.kv("data", options);
    let renderdCache = utils.kv("renderdCache", options);
    this.cachable = utils.kv("cachable", options);
    this.autoAppend = utils.kv("autoAppend", options, true);
    this.contentOnly = utils.kv("contentOnly", options, false);
    this.allContent = utils.kv("allContent", options, false)
    this.methods = utils.kv("methods", options, null);
    this._methodsMap = [];
    let helpers = utils.kv("helpers" , options)
    // #コンパイラーのキャッシュ
    this.compilerCacheName = utils.kv("compilerCacheName", options);
    this._init(el, data, renderdCache);

    if(helpers)
      this._bindHelpers(helpers);
  }

  _setDefault(){
    this.builder = null;
    this.datas = null;
    this.methods = null;
    this._methodsMap = null;
    this.compiler = null;
    this.autoBuild = false;
    //ビルドが完了しているかどうか
    this.isBuilded = false;
    this.compilerCacheName = null;
    this.cachable = false;
    this.safe = escaper;
    this.autoAppend = false;
    this.contentOnly = false;
    // #全部返す
    this.allContent = false;
    this.helpers = null;
  }


  _init(el, data, renderdCache){
    if(!el)
      throw new Error("エレメントはなんかしていして")// or body?

    if(this.cachable && !this.compilerCacheName)
      this.compilerCacheName = "ikari-cache" + el;

    this.builder = new Builder(el, this);
    if(window.localStorage && this.compilerCacheName){
      let cache = localStorage.getItem(this.compilerCacheName);
      console.log(cache.split(','));
      this.compiler = ((func, args, ctor)=>{
          ctor.prototype = func.prototype;
          var child = new ctor, result = func.apply(child, args);
          return Object(result) === result ? result : child;
        })( Function, cache.split(','), ()=>{});
      if(this.compiler && data && this.autoBuild) {
        this.create(data);
        return
      } else {
        setTimeout(()=>{
          this.emit(new Event(Event.BUILDED));
        }, 1);
      }
    }


    if(renderdCache) {
      let dom = utils.erase(utils.query(el));
      dom.appendChild(renderdCache);
    }

    if(this.autoBuild && ! this.isBuilded && !this.compiler)
      this.builder.build(this);
    // #データを初期オプションとして引き渡されていてかつ autoBuild が true になっていたらもうレンダリングまでしてしまう
    if (data && this.autoBuild) {
      this.builder.build(this);
      this.create(data);
    }
  }



  /**
    ビルドする
    @method build
  */
  build(){
     if(!this.compiler){
      this.builder.build(this);
    }
  }


  /**
    作る
    @method create
    この時、テンプレートとして指定した element の中身は消去される
  */
  create(data){
    if (!this.compiler)
      throw new Error("準備出来てないじゃないですか?")
    let dom = utils.erase(this.builder.el);
    let result = this._update(data, dom);
    return result;
  }


  /**
    データを更新する
    @method update
    この時、テンプレートとして指定した element の中にデータが追加される
  */
  update(data){
    if(!this.compiler){
      throw new Error("準備出来てないじゃないですか?")
    }
    let dom = this.builder.el;
    let result = this._update(data, dom);
    return result;
  }


  serialize(){
    if(this.builder.el.tagName.toLowerCase() == "form") {
      let results = [];
      this.builder.el.elements.map((el)=>{
        let tagName = el.tagName.toLowerCase();
        if(INPUTS.indexOf(tagName) > -1){
          let value = el.value;
          let name = el.name;
          let result = {};
          result[name] = value;
          results.push(result);
        }
      });
      return results;
    }
  }


  /**
    @method _update
    @private
  */
  _update(data, dom){
    this.datas = data;
    //tmp =  if data instanceof Array then this.compiler data... else this.compiler data
    let tmp = this.compiler(data);
    let container = document.createElement("div");
    container.innerHTML = tmp;
    let children = container.children;
    let fragment = document.createDocumentFragment();
    for(let i = 0; i<children.length;i++){
      let child = children[i];
      if(!child){
        continue;
      }
      fragment.appendChild(child.cloneNode(true));
    }
    if(this.replace){
      let parent = this.builder.el.parentNode;
      for(let i = 0; i < parent.children.length; i++ ){
        let child = parent.children[i];
        parent.removeNode(child);
      }
      parent.appendChild(fragment);
    }
    //イベント出す
    this.emit(new Event(Event.UPDATED));
    if(this.contentOnly){
      let isSingleNode = (fragment.childNodes[0].childNodes.length == 1);
      let isTextNode = (fragment.childNodes[0].childNodes[0].nodeType == Node.TEXT_NODE);
      if(isSingleNode && isTextNode){
        // # contentOnlyモードでノードが1つしかなかった場合。ifが深いのであとで直してくだしあ
        return fragment.textContent;
      }else{
        return fragment.childNodes[0].children;
      }
    }
    if(this.allContent){
      return fragment.childNodes;
    }


    let els = fragment.childNodes[0].children;
    // #仮
    if(this.autoAppend){
      for(let i = 0; i < els.length; i++){
        let child = els[i];
        if(child){
          this.builder.el.appendChild(child.cloneNode(true));
        }
      }
    }

    this._bindMethods();

    return fragment.childNodes[0];
  }

  /**
    helper のバインド
    @method _bindHelper
    @private
  */
  _bindHelpers( helpers ){
    for(let helper in helpers){
      let func = helpers[helper];
      if(typeof func == "function"){this[helper] = func;}
    }
  }


  /**
    ディレクティブのバインド
    @method _bindMethods
  */
  _bindMethods(){
    for( let i; i < this._methodsMap.length; i++){
      let directive = this._methodsMap[i];
      if (!this.methods.hasOwnProperty(directive.method)){
        continue;
      }
      let el = utils.query(directive.path);
      if(!el) continue;
      method = this.methods[directive.method];
      el.removeEventListener(directive.action, method);
      el.addEventListener(directive.action, method);
    }
  }

// do(window) -> window.Ikari = Ikari
}
