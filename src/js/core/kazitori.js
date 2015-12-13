let delegater = (target, func)=>{
  return ()=>{
    func.apply(target, arguments);
  }
}

// regexps
const trailingSlash = /\/$/
const routeStripper = /^[#\/]|\s+$/g
const escapeRegExp = /[\-{}\[\]+?.,\\\^$|#\s]/g
const namedParam = /<(\w+|[A-Za-z_\-0-9]+:\w+)>/g
const genericParam = /([A-Za-z_\-0-9]+):(\w+)/
const filePattern  = /\w+\.[a-zA-Z0-9]{3,64}/

const optionalParam = /\((.*?)\)/g
const splatParam = /\*\w+/g

//--------------------------------------------

/**URL 変数に対して指定できる型###
# **Default:**
#
# * int : Number としてキャストされます
# * string : String としてキャストされます
*/

const VARIABLE_TYPES = [
  {
    name:"int",
    cast:Number
  },
  {
    name:"string",
    cast:String
  }
]

// #--------------------------------------------

/**
* Kazitori.js は pushState をいい感じにさばいてくれるルーターライブラリです。<br>
* シンプルかつ見通しよく pushState コンテンツのルーティングを定義することができます。
*
* 使い方はとても簡単。
* <ul><li>Kazitori を継承したクラスを作る</li><li>routes に扱いたい URL と、それに対応したメソッドを指定。</li><li>インスタンス化</li></ul>
*
* <h4>example</h4>
*      class Router extends Kazitori
*        routes:
*          "/": "index"
*          "/<int:id>": "show"
*
*        index:()->
*          console.log "index!"
*        show:(id)->
*          console.log id
*
*      $(()->
*        app = new Router()
*      )
*
* Kazitori では pushState で非同期コンテンツを作っていく上で必要となるであろう機能を他にも沢山用意しています。<br>
* 詳細は API 一覧から確認して下さい。
* thismodule Kazitori.js
* thismain Kazitori
*/

// Kazitori クラス

/**
*  Kazitori のメインクラス
*
*  thisclass Kazitori
*  thisconstructor
*/
export default class Kazitori {
  _setDefault(){
    this.VERSION = "1.0.2";
    this.history = null;
    this.location = null;


    /**
    * マッチするURLのルールと、それに対応する処理を定義します。
    * <h4>example</h4>
    *     routes:
    *       '/':'index'
    *       '/<int:id>':'show'
    *
    * thisproperty routes
    * thistype Object
    * thisdefault {}
    */
    this.routes = {};

    this.handlers = [];


    /**
    * マッチした URL に対する処理を行う前に実行したい処理を定義します。
    * thisproperty befores
    * thistype Object
    * thisdefault {}
    */
    this.befores = {};
    this.beforeHandlers = [];


    /**
    * URL が変わる際、事前に実行したい処理を定義します。<br>
    * このプロパティに登録された処理は、与えられた URL にマッチするかどうかにかかわらず、常に実行されます。
    * thisproperty beforeAnytimeHandler
    * thistype Array
    * thisdefault []
    */
    this.beforeAnytimeHandler = null;
    this.afterhandlers = [];


    /**
    * 特定のファイル名が URL に含まれていた時、ルートとして処理するリストです。
    * thisproperty rootFiles
    * thistype Array
    */
    this.rootFiles = ['index.html', 'index.htm', 'index.php', 'unko.html'];


    /**
    * ルートを指定します。<br>
    * ここで指定された値が URL の prefix として必ずつきます。<br>
    * 物理的に URL のルートより 1ディレクトリ下がった箇所で pushState を行いたい場合<br>
    * この値を / 以外に指定します。
    * <h4>example</h4>
    * コンテンツを配置する実ディレクトリが example だった場合
    *
    *     app = new Router({root:'/example/'})
    * thisproperty root
    * thistype String
    * thisdefault /
    */
    this.root = null;


    /**
    * 現在の URL にマッチするルールがなかった場合に変更する URL
    * thisproperty notFound
    * thistype String
    * thisdefault null
    */
    this.notFound = null;

    this.direct = null;
    this.isIE = false;


    /**
    * URL を実際には変更しないようにするかどうかを決定します。<br>
    * true にした場合、URL は変更されず、内部で保持している状態管理オブジェクトを基準に展開します。
    * thisproperty silent
    * thistype Boolean
    * thisdefault false
    */
    this.silent = false;


    /**
    * pushState への監視が開始されているかどうか
    * thisproperty started
    * thistype Boolean
    * thisdefault false
    */
    this.started = false;


    // #URL パラメーター
    this._params = {
      params:[],
      'fragment':''
    };


    /**
    * before 処理が失敗した時に実行されます。<br>
    * デフォルトでは空の function になっています。
    *
    * thismethod beforeFailedHandler
    */
    this.beforeFailedHandler = ()=>{}



    // ###isBeforeForce###
    this.isBeforeForce = false;
    // #befores の処理を URL 変更前にするかどうか
    this.isTemae = false;
    this._changeOptions = null;

    this.isNotFoundForce = false;
    this._notFound = null;

    this.breaker = {};

    this._dispatcher = null;
    this._beforeDeffer = null;

    /**
    * 現在の URL を返します。
    * thisproperty fragment
    * thistype String
    * thisdefault null
    */
    this.fragment = null;


    /**
    * 現在の URL から 1つ前の URL を返します。
    * thisproperty lastFragment
    * thistype String
    * thisdefault null
    */
    this.lastFragment = null;
    this.isUserAction = false;

    this._isFirstRequest = true;

    // #pushState が使えない IE で初回時にリダイレクトするかどうか
    this.isInitReplace = true;

    // #末尾のスラッシュ
    this.isLastSlash = false;



    /**
    * 一時停止しているかどうかを返します。
    *
    * thisproperty isSuspend
    * thistype Boolean
    * thisdefault false
    */
    this.isSuspend = false;


  }

  constructor(options){
    // this._setDefault();
    //---- 初期値 -----
    this._processStep = {
      'status': 'null',
      'args': []
    }
    this.isUserAction = false;
    //---- /初期値 -----
    this._processStep.status = 'constructor';
    this._processStep.args = [options];
    this.options = options || (options = {});

    this.routes = {};
    if(options.routes){
      this.routes = options.routes;
    }

    this.befores = {};
    if(options.befores){
      this.befores = options.befores;
    }

    this.root          = (options.hasOwnProperty("root")) ? options.root : (this.root == null) ? '/' : this.root;
    this.isTemae       = (options.isTemae) ? options.isTemae : false;
    this.silent        = (options.silent) ? options.silent : false;
    this.isInitReplace = (options.hasOwnProperty("isInitReplace")) ? options.isInitReplace : true;
    this.isLastSlash   = (options.hasOwnProperty("isLastSlash")) ? options.isLastSlash : false;

    this._params = {
      params:[],
      queries:{},
      fragment:null
    };

    // #見つからなかった時強制的に root を表示する
    if(this.notFound == null) {
      this.notFound = (options.notFound) ? options.notFound : this.root;
    }

    let win = window;
    if( typeof win != 'undefined'){
      this.location = win.location;
      this.history = win.history;
    }
    let docMode = document.documentMode;
    this.isIE = win.navigator.userAgent.toLowerCase().indexOf('msie') != -1;
    this.isOldIE = (this.isIE && (!docMode||docMode < 9));
    this._dispatcher = new EventDispatcher();
    this.handlers = [];
    this.beforeHandlers = [];
    this._bindBefores();
    this._bindRules();
    this._bindNotFound();

    try {
      Object.defineProperty(this, 'params', {
        enumerable : true,
        get:()=>{
          return this._params.params;
        }})
      Object.defineProperty(this, 'queries', {
        enumerable : true,
        get:()=>{
          return this._params.queries;
        }
        })
    } catch(e) {
      if(this.isOldIE){
        this.params = this._params.params;
        this.queries = this._params.queries;
      }
      // #throw new Error(e)
      // #IEだと defineProperty がアレらしいので
      // #this.__defineGetter__ したほうがいいかなー
    }

    if(!this.options.isAutoStart || this.options.isAutoStart != false){
      this.start();
    }
  }


  /**
  * Kazitori.js を開始します。<br>
  * START イベントがディスパッチされます。
  * thismethod start
  * thisparam {Object} options オプション
  */
  start(options){
    this._processStep.status = 'start';
    this._processStep.args = [options];
    if( this.started){
      throw new Error('mou hazim matteru');
    }
    this.started = true;
    let win = window;
    this.options = this._extend({}, {root:'/'}, this.options, options);
    this._hasPushState = !!(this.history && this.history.pushState);
    this._wantChangeHash = (this.options.hashChange !== false);
    let fragment = this.fragment = this.getFragment();

    let atRoot = (this.location.pathname.replace(/[^\/]$/, '$&/') == this.root);
    // #ここ?
    let ieFrag;
    if (this.isIE && !atRoot && !this._hasPushState && this.isInitReplace && !this.silent){
      ieFrag = this.location.pathname.replace(this.root, '');
      this._updateHashIE(ieFrag);
    }
    let frame;
    if (this.isOldIE && this._wantChangeHash) {
      frame = document.createElement("iframe");
      frame.setAttribute("src","javascript:0");
      frame.setAttribute("tabindex", "-1");
      frame.style.display = "none";
      document.body.appendChild(frame);
      this.iframe = frame.contentWindow;
      this.change(fragment);
    }

    this._addPopStateHandler();

    if( this._hasPushState && atRoot && this.location.hash) {
      this.fragment = this.lastFragment = this.getHash().replace(routeStripper, '');
      this.history.replaceState({}, document.title, this.root + this.fragment + this.location.search);
    }
    // #スタートイベントをディスパッチ
    this._dispatcher.dispatchEvent( new KazitoriEvent( KazitoriEvent.START, this.fragment ))

    let override = this.root;
    if(!this.silent){
      if (!this._hasPushState && atRoot){
        override = this.fragment;
      } else if(!atRoot){
        override = this.fragment;
      }
    } else {
      override = this.fragment
    }
    return this.loadURL(override);
  }


  /**
  * Kazitori.js を停止します。<br>
  * STOP イベントがディスパッチされます。
  * thismethod stop
  */
  stop(){
    let win = window;
    win.removeEventListener('popstate', this.observeURLHandler);
    win.removeEventListener('hashchange', this.observeURLHandler)
    this.started = false;
    // #ストップイベントをディスパッチ
    this._dispatcher.dispatchEvent(new KazitoriEvent(KazitoriEvent.STOP, this.fragment));
  }


  /**
  * ブラウザのヒストリー機能を利用して「進む」を実行します。<br>
  * 成功した場合 NEXT イベントがディスパッチされます。
  * thismethod torikazi
  * thisparam {Object} options
  */
  torikazi(options){
    return this.direction(options, "next");
  }

  /**
  * ブラウザヒストリー機能を利用して「戻る」を実行します。<br>
  * 成功した場合 PREV イベントがディスパッチされます。
  * thismethod omokazi
  * thisparam {Object} options
  */
  omokazi(options){
    return this.direction(options, "prev");
  }

  direction(option, direction){
    if(!this.started)
      return false;
    let tmpFrag = this.lastFragment;
    this.lastFragment = this.getFragment();
    this.direct = direction;
    this.isUserAction = true;
    this._removePopStateHandler();
    if(direction == "prev"){
      this.history.back();
      this._dispatcher.dispatchEvent( new KazitoriEvent( KazitoriEvent.PREV, tmpFrag, this.lastFragment ));
    } else if(direction == "next"){
      this.history.forward();
      this._dispatcher.dispatchEvent( new KazitoriEvent( KazitoriEvent.NEXT, tmpFrag, this.lastFragment ));
    } else {
      return
    }
    this._addPopStateHandler();
    return this.loadURL(tmpFrag);
  }

  /**
  * url を変更します。<br>
  * 無事 URL が切り替わった場合、CHANGE イベントがディスパッチされます。
  * <h4>example</h4>
  *     app.change('/someurl');
  * thismethod change
  * thisparam {String} fragment 変更したい URL
  * thisparam {Object} options オプション
  */
  change(fragment, options){
    if(!this.started)
      return false;
    this._processStep.status = 'change';
    this._processStep.args = [fragment, options];
    if(!options)
      options = {'trigger':options};
    this._changeOptions = options;

    // #TODO : this に突っ込んじゃうとこのあと全部 BeforeForce されてまう
    this.isBeforeForce = (options.isBeforeForce != false)
    let frag = this.getFragment(fragment || '');
    if(this.fragment == frag)
      return
    this.lastFragment = this.fragment;
    this.fragment = frag;
    let next = this.fragment;

    // #memo : jasmine だけなんかおかしい
    // #frag が undefined になってしまう
    // # console.debug frag
    let url = this.root + this._replace.apply(frag,[routeStripper, '']);
    let matched = this._matchCheck(this.fragment, this.handlers);
    if(!matched){
      this.fragment = this.fragment.replace(this.root, '');
      matched = this._matchCheck(this.fragment, this.handlers);
    }

    if(matched == false && this.isNotFoundForce == false) {
      if(this.notFound != null) {
        this._notFound.callback(this.fragment);
        url = this.root + this._notFound.rule.replace(routeStripper, '');
        this.history[ (options.replace) ? 'replaceState' : 'pushState' ]({}, document.title, url);
      }
      this._dispatcher.dispatchEvent(new KazitoriEvent(KazitoriEvent.NOT_FOUND));
      return
    }
    if (this.isTemae && (this.beforeAnytimeHandler || this.beforeHandlers.length > 0)){
      this_executeBefores(frag)
    } else {
      this._urlChange(frag, options);
    }
  }

  /**
  * pushState ではなく replaceState で処理します。<br>
  * replaceState は現在の URL を置き換えるため、履歴には追加されません。
  * <h4>example</h4>
  *     app.replace('/someurl');
  * thismethod replace
  * thisparam {String} fragment 変更したい URL
  * thisparam {Object} options オプション
  */
  replace(fragment, options){
    this._processStep.status = 'replace'
    this._processStep.args = [fragment, options]
    if(!options){
      options = {replace:true};
    } else if(!options.replace || options.replace == false) {
      options.replace = true;
    }
    this.change(fragment, options);
  }


  _urlChange(fragment, options){
    this._processStep.status = '_urlChange'
    this._processStep.args = [fragment, options]

    if(this.isSuspend)
      return
    if(!options){
      options = this._changeOptions
    }
    let url = this.root + this.fragment.replace(routeStripper, '');
    // #末尾に slash を付ける必要がある場合つける
    let isFile = url.match(filePattern);
    let isLastSlash = url.match(trailingSlash);
    if( this.isLastSlash && !isFile && !isLastSlash)
      url += "/";

    if (!this.silent){
      if(this._hasPushState){
        this.history[(options.replace) ? 'replaceState' : 'pushState' ]({}, document.title, url)
      } else if(this._wantChangeHash) {
        this._updateHash(this.location, fragment, options.replace);
        if(this.iframe && (fragment != this.getFragment(this.getHash(this.iframe)))) {
          if(!options.replace)
            this.iframe.document.open().close();
          this._updateHash(this.iframe.location, fragment, options.replace);
        }
      } else {
        return this.location.assign(url);
      }
    }

    // #イベントディスパッチ
    this.dispatchEvent(new KazitoriEvent(KazitoriEvent.CHANGE, this.fragment, this.lastFragment));
    if(options.internal && options.internal == true)
      this._dispatcher.dispatchEvent( new KazitoriEvent(KazitoriEvent.INTERNAL_CHANGE, this.fragment, this.lastFragment));
    this.loadURL(this.fragment, options);

  }


  /**
  * 中止します。
  * thismethod reject
  */
  reject(){
    this.dispatchEvent(new KazitoriEvent(KazitoriEvent.REJECT, this.fragment ));
    if(this._beforeDeffer){
      this._beforeDeffer.removeEventListener(KazitoriEvent.TASK_QUEUE_COMPLETE, this.beforeComplete)
      this._beforeDeffer.removeEventListener(KazitoriEvent.TASK_QUEUE_FAILED, this.beforeFailed);
      this._beforeDeffer = null;
    }
  }

  /**
  * 処理を一時停止します。<br>
  * SUSPEND イベントがディスパッチされます。
  * thismethod suspend
  */
  suspend(){
    if(this._beforeDeffer)
      this._beforeDeffer.suspend();
    this.started = false;
    this.isSuspend = true;
    this._dispatcher.dispatchEvent( new KazitoriEvent( KazitoriEvent.SUSPEND, this.fragment, this.lastFragment ));
  }

  /**
  * 処理を再開します。<br>
  * RESUME イベントがディスパッチされます。
  * thismethod resume
  */
  resume(){
    if(this._beforeDeffer)
      this._beforeDeffer.resume();
    this.started = true;
    this.isSuspend = false;
    this[this._processStep.status](this._processStep.args);

    this._dispatcher.dispatchEvent( new KazitoriEvent( KazitoriEvent.RESUME, this.fragment, this.lastFragment ));
  }

  registerHandler(rule, name, isBefore, callback ){
    if(!callback){
      if(isBefore){
        callback = this._bindFunctions(name);
      } else if(name instanceof Kazitori) {
        this._bindChild(rule, name);
        return this;
      } else if(typeof name == "function") {
        // #これ再帰的にチェックするメソッドに落としこもう
        // #__super__ って coffee のクラスだけなきガス
        // #むーん
        if(name.hasOwnProperty('__super__')){
          try {
            let child = new name({'isAutoStart':false});
            this._bindChild(rule, child);
            return this;
          } catch(e) {
            callback = name;
          }
        } else {
          callback = name;
        }
      } else {
        callback = this[name];
      }
    }
    let target = (isBefore) ? this.beforeHandlers : this.handlers;
    target.unshift(new Rule(rule, function(fragment){
      let args = this.router.extractParams(this, fragment);
      callback && callback.apply(this.router, args)
    },this));
    return this;
  }

  _bindChild(rule, child){
    child.reject();
    child.stop();
    childHandlers = child.handlers.concat();
    childHandlers.map((childRule)=>{
      childRule.update(rule);
    });
    this.handlers = childHandlers.concat(this.handlers);

    childBefores = child.beforeHandlers.concat();
    childBefores.map((childBefore)=>{
      childBefore.update(rule);
    });

    this.beforeHandlers = childBefores.concat(this.beforeHandlers);

    if(child.beforeAnytimeHandler){
      this.lastAnytime = this.beforeAnytime.concat();
      this._bindBeforeAnytime(this.beforeAnytime, [child.beforeAnytimeHandler.callback]);
    }
    // #これでどうにかならんかな…
    child.root = this.root;
  }


  /**
  * ルーターを動的に追加します。<br>
  * ルーターの追加に成功した場合、ADDED イベントがディスパッチされます。
  * <h4>example</h4>
  *     fooRouter = new FooRouter();
  *     app.appendRouter(foo);
  * thismethod appendRouter
  * thisparam {Object} child
  * thisparam {String} childRoot
  */
  appendRouter(child, childRoot){
    if(!child instanceof Kazitori && typeof child != "function"){
      throw new Error("引数の値が不正です。 引数として与えられるオブジェクトは Kazitori を継承している必要があります。")
      return
    }

    if(child instanceof Kazitori){
      let rule = this._getChildRule(child, childRoot)
      this._bindChild(rule, child);
      return this;
    } else {
      if(child.hasOwnProperty('__super__') ){
        try{
          _instance = new child({'isAutoStart':false});
          let rule = this._getChildRule(_instance, childRoot);
          this._bindChild(rule, _instance);
          return this
        }catch(e){
          throw new Error("引数の値が不正です。 引数として与えられるオブジェクトは Kazitori を継承している必要があります。");
        }
      }
    }
    this._dispatcher.dispatchEvent( new KazitoriEvent( KazitoriEvent.ADDED, this.fragment, this.lastFragment ))
    return this;
  }

  _getChildRule(child, childRoot){
    let rule = child.root;
    if(childRoot)
      rule = childRoot;
    if(rule.match(trailingSlash))
      rule = rule.replace(trailingSlash, '');
    if(rule == this.root)
      throw new Error("かぶってる");
    return rule;
  }

  /**
  * 動的に追加したルーターを削除します。
  * ルーターの削除に成功した場合、REMOVED イベントがディスパッチされます。
  * <h4>example</h4>
  *     foo = new FooRouter();
  *     app.appendRouter(foo);
  *     app.removeRouter(foo);
  * thismethod removeRouter
  * thisparam {Object} child
  * thisparam {String} childRoot
  */
  removeRouter(child, childRoot){
    if( !child instanceof Kazitori && typeof child != "function"){
      throw new Error("引数の値が不正です。 引数として与えられるオブジェクトは Kazitori を継承している必要があります。");
      return;
    }
    if(child instanceof Kazitori){
      this._unbindChild(child, childRoot);
    } else {
      if(child.hasOwnProperty('__super__')){
        try {
          let _instance = new child({'isAutoStart':false});
          this._unbindChild(_instance, childRoot);
          return this;
        } catch(e) {
          throw new Error("引数の値が不正です。 引数として与えられるオブジェクトは Kazitori を継承している必要があります。");
        }
      }
    }
    this._dispatcher.dispatchEvent( new KazitoriEvent(KazitoriEvent.REMOVED, this.fragment, this.lastFragment));
    return this;
  }

  _unbindChild(child, childRoot){
    let rule = this._getChildRule(child, childRoot);
    let i = 0;
    let len = this.handlers.length;
    let newHandlers = [];
    while(i < len){
      let ruleObj = this.handlers.shift();
      if(ruleObj.rule.match(rule) == null)
        newHandlers.unshift(ruleObj);
      i++;
    }
    this.handlers = newHandlers;

    i = 0;
    len = this.beforeHandlers.length;
    let newBefores = [];
    while(i < len){
      let beforeRule = this.beforeHandlers.shift();
      if(beforeRule.rule.match(rule) == null)
        newBefores.unshift(beforeRule);
      i++;
    }
    this.beforeHandlers = newBefores;
  }

  /**
  * ブラウザから現在の URL を読み込みます。
  * thismethod loadURL
  * thisparam {String} fragmentOverride
  * thisparam {Object} options
  */
  loadURL(fragmentOverride, options){
    this._processStep.status = 'loadURL';
    this._processStep.args = [fragmentOverride, options];
    if( this.isSuspend)
      return
    let fragment = this.fragment = this.getFragment(fragmentOverride);
    if(this.isTemae == false && (this.beforeAnytimeHandler || this.beforeHandlers.length > 0)){
      this._executeBefores(fragment);
    } else {
      this.executeHandlers();
    }
  }

  /**
  * 指定した 文字列に対応した URL ルールが設定されているかどうか<br>
  * Boolean で返します。
  * <h4>example</h4>
  *     app.match('/hoge');
  * thismethod match
  * thisparam {String} fragment
  * thisreturn {Boolean}
  */
  match(fragment){
    let matched = this._matchCheck(fragment, this.handlers, true);
    return matched.length > 0;
  }



  // #before で登録した処理が無難に終わった
  beforeComplete(event){
    this._beforeDeffer.removeEventListener(KazitoriEvent.TASK_QUEUE_COMPLETE, this.beforeComplete);
    this._beforeDeffer.removeEventListener(KazitoriEvent.TASK_QUEUE_FAILED, this.beforeFailed);

    this._dispatcher.dispatchEvent( new KazitoriEvent(KazitoriEvent.BEFORE_EXECUTED, this.fragment, this.lastFragment))
    // #ここではんだんするしかないかなー
    if(this.isTemae){
      this._urlChange(this.fragment, this._changeOptions)
    } else{
      this.executeHandlers()
    }
  }

  // #登録されたbefores を実行
  _executeBefores(fragment){
    this._processStep.status = '_executeBefores';
    this._processStep.args = [fragment];
    this._beforeDeffer = new Deffered();
    if(this.beforeAnytimeHandler){
      this._beforeDeffer.deffered((d)=>{
        this.beforeAnytimeHandler.callback(fragment);
        d.execute(d);
      });
    }

    let matched = this._matchCheck(fragment, this.beforeHandlers);
    matched.map((handler)=>{
      this._beforeDeffer.deffered((d)=>{
        handler.callback(fragment);
        d.execute(d);
      });
    });
    this._beforeDeffer.addEventListener(KazitoriEvent.TASK_QUEUE_COMPLETE, this.beforeComplete);
    this._beforeDeffer.addEventListener(KazitoriEvent.TASK_QUEUE_FAILED, this.beforeFailed);
    this._beforeDeffer.execute(this._beforeDeffer);
  }

  // #routes で登録されたメソッドを実行
  executeHandlers(){
    this._processStep.status = 'executeHandlers';
    this._processStep.args = [];
    if(this.isSuspend)
      return
    // #フラグメントとる
    this.fragment = this.getFragment();
    // #毎回 match チェックしてるので使いまわしたいのでリファクタ
    let matched = this._matchCheck(this.fragment, this.handlers);

    let isMatched = true;
    if (matched == false || matched.length < 1){
      if( this.notFound != null && this._notFound != null && this._notFound.callback){
        this._notFound.callback(this.fragment);
      }
      isMatched = false;
      this._dispatcher.dispatchEvent(new KazitoriEvent(KazitoriEvent.NOT_FOUND));
    } else if( matched.length > 1){
      let called = false;
      matched.map((match)=>{
        if( this.fragment.indexOf(match.rule) > -1){
          match.callback(this.fragment);
          called = true;
        }
      });

      if(!called) {
        matched.reverse()[0].callback(this.fragment);
      }
    } else {
      matched.map((handler)=>{
        handler.callback.call(handler, this.fragment);
      });
    }
    if(this._isFirstRequest){
      // #間に合わないので遅延させて発行
      setTimeout(()=>{
        this._dispatcher.dispatchEvent( new KazitoriEvent(KazitoriEvent.FIRST_REQUEST, this.fragment, null));
        if(isMatched){
          this._dispatcher.dispatchEvent( new KazitoriEvent(KazitoriEvent.EXECUTED, this.fragment, null));
        }
      },0);
      this._isFirstRequest = false
    } else {
      if(isMatched){
        this._dispatcher.dispatchEvent( new KazitoriEvent(KazitoriEvent.EXECUTED, this.fragment, this.lastFragment));
      }
    }
    return matched;
  }


  beforeFailed(event){
    this.beforeFailedHandler.apply(this, arguments);
    this._beforeDeffer.removeEventListener(KazitoriEvent.TASK_QUEUE_FAILED, this.beforeFailed);
    this._beforeDeffer.removeEventListener(KazitoriEvent.TASK_QUEUE_COMPLETE, this.beforeComplete);
    if(this.isBeforeForce)
      this.beforeComplete();
    this._beforeDeffer = null;
  }


  // #URL の変更を監視
  observeURLHandler(event){
    let current = this.getFragment();
    if( current == this.fragment && this.iframe){
      current = this.getFragment(this.getHash(this.iframe));
    }
    if( current == this.fragment)
      return false;
    if( this.iframe)
      this.change(current);
    if( this.lastFragment == current && this.isUserAction == false){
      this._dispatcher.dispatchEvent( new KazitoriEvent( KazitoriEvent.PREV, current, this.fragment ));
    }else if (this.lastFragment == this.fragment && this.isUserAction == false){
      this._dispatcher.dispatchEvent( new KazitoriEvent( KazitoriEvent.NEXT, current, this.lastFragment ));
    }
    this.isUserAction = false;
    this._dispatcher.dispatchEvent( new KazitoriEvent( KazitoriEvent.CHANGE, current, this.lastFragment ));
    return this.loadURL(current);
  }

  // # routes から指定されたルーティングをバインド
  _bindRules(){
    if(!this.routes)
      return
    let routes = this._keys(this.routes);
    routes.map((rule)=>{
      this.registerHandler(rule, this.routes[rule], false);
    });
  }

  // # befores から指定された事前に処理したいメソッドをバインド
  _bindBefores(){
    if(this.beforeAnytime){
      this._bindBeforeAnytime(this.beforeAnytime);
    }
    if(this.befores)
      return
    let befores = this._keys(this.befores);
    befores.map((key)=>{
      this.registerHandler(key, this.befores[key], true);
    });
  }


  _bindBeforeAnytime(funcs, bindedFuncs){
    let callback = this._bindFunctions(funcs, bindedFuncs);
    this.beforeAnytimeHandler = {
      callback:this._binder((fragment)=>{
        let args = [fragment];
        callback && callback.apply(this, args);
      },this)
    }
  }

  // # notFound で指定されたメソッドをバインド
  _bindNotFound(){
    if(!this.notFound)
      return
    let notFoundFragment;
    if(typeof this.notFound == "string"){
      for(let i=0; i < this.handlers.length; i++){
        let rule = this.handlers[i];
        if( rule.rule == '/' + this.notFound.replace(this.root, '')){
          this._notFound = rule;
          return
        }
      }
    } else{
      notFoundFragment = this_keys(this.notFound)[0];
    }

    let notFoundFuncName = this.notFound[notFoundFragment];
    let callback;
    if( typeof notFoundFuncName == "function"){
      callback = notFoundFuncName;
    } else {
      callback = this[notFoundFuncName];
    }

    this._notFound = new Rule(notFoundFragment, (fragment)=>{
      let args = this.router.extractParams(this, fragment);
      callback && callback.apply(this.router, args);
    },this)
  }

  _updateHash(location, fragment, replace){
    let atRoot = (this.location.pathname.replace(/[^\/]$/, '$&/') == this.root);
    if(!atRoot){
      location.replace(this.root + '#' + fragment);
      return
    }
    if(replace){
      let href = location.href.replace( /(javascript:|#).*$/, '');
      location.replace(href + '#' + fragment);
    } else{
      location.hash = "#" + fragment;
    }
  }

  // #zantei
  _updateHashIE(fragment, replace){
    location.replace(this.root + '#/' + fragment);
  }
  /*
  #マッチする URL があるかどうか
  # memo : 20130130
  # ここでここまでのチェックを実際に行うなら
  # loadURL, executeHandler 内で同じチェックは行う必要がないはずなので
  # それぞれのメソッドが簡潔になるようにリファクタする必要がある
  */
  _matchCheck(fragment, handlers, test=false){
    let matched = [];
    let tmpFrag = fragment;
    let hasQuery;
    if( tmpFrag != undefined && tmpFrag != 'undefined')
      hasQuery = this._match.apply(tmpFrag, [/(\?[\w\d=|]+)/g]);
    if(hasQuery)
      fragment = fragment.split('?')[0];
    for(let i =0; i < handlers.length; i++){
      let handler = handlers[i];
      // #just match, ラストスラッシュ
      if(handler.rule == fragment || handler.rule == fragment.slice(0, fragment.length - 1)){
        matched.push(handler);
      } else if(handler.test(fragment)){
        if(handler.isVariable && handler.types.length > 0){
          // #型チェック用
          let args;
          try{
            args = this.extractParams(handler, fragment, test)
          } catch(error){
            console.error(error);
          }
          let argsMatch = [];
          let len = args.length;
          let i = 0;
          while(i < len){
            let a = args[i];
            let t = handler.types[i];
            if( typeof a != "object")
              argsMatch.push((!t) ? true : this._typeCheck(a,t));
            i++;
          }
          let argsMatched = true;
          argsMatch.map((match)=>{
            if(!match)
              argsMatched = false;
          });

          // #ここだ
          if(argsMatched)
            matched.push(handler);
        } else {
          matched.push(handler);
        }
      }
    }
    return (matched.length > 0) ? matched : false;
  }
  /*
  #===============================================
  #
  # URL Queries
  #
  #==============================================
  */

  /**
  * URL ルート以下を取得
  * thismethod getFragment
  * thisparam {String} fragment
  */
  getFragment(fragment){
    let root;
    if(!fragment || fragment == undefined){
      if(this._hasPushState || !this._wantChangeHash || (this.isIE && this.silent)){
        fragment = this.location.pathname;
        let matched = false;
        let frag = fragment;

        if(frag.match(/^\//))
          frag = frag.substr(1);
        root = this.root;
        if(root.match(/^\//)){
          root = root.substr(1);
        }
        // if(matched)
        //   fragment = this.root;
        fragment = fragment + this.location.search;
        root = this.root.replace(trailingSlash, '');

        if(fragment.indexOf(root) > -1){
          fragment = fragment.substr(root.length);
        }
      } else{
        fragment = this.getHash();
      }
    }else{
      root = this.root.replace(trailingSlash, '');

      if(fragment.indexOf(this.root) > -1 && fragment.indexOf(root) > -1){
        fragment = fragment.substr(root.length);
      }
    }
    if(typeof fragment == "string"){
      if(fragment == "")
        fragment = "/";
    }
    if( this.isIndexReplace){
      this.rootFiles.map((index)=>{
        if(fragment.indexOf(index) > -1)
          fragment = fragment.replace(index, '');
      });
    }

    return fragment;
  }


  /**
  * URL の # 以降を取得
  * thismethod getHash
  * thisreturn {String} URL の # 以降の文字列
  */
  getHash(){
    let match = (window || this).location.href.match(/#(.*)$/);
    if(match){
      return match[1];
    } else {
      return '';
    }
  }


  /**
  * URL パラメータを分解
  * thismethod extractParams
  * thisparam {Rule} rule
  * thisparam {String} fragment
  * thisparam {Boolean} test
  */
  extractParams(rule, fragment, test=false){
    if(this._params.params.length > 0 && this._params.fragment == fragment)
      return this._params.params;
    let param = rule._regexp.exec(fragment);
    if( param == null && fragment.indexOf('?') > -1){
      let frag = fragment.split('?')[0];
      param = rule._regexp.exec(frag);
      if(!param) param = [];
      let query = '?' + fragment.split('?')[1];
      param.push(query);
    }
    this._params.fragment = fragment;
    if(param){
      // #掃除
      let tmp = [];
      param.map((p)=>{
        if( p != undefined && p != null)
          tmp.push(p);
      });
      param = tmp;
      let newParam = param.slice(2);
      let last = param[param.length - 1];
      // #ゲットパラメーター待
      if(last.indexOf('?') > -1){
        let newQueries = {};
        let queries = last.split('?')[1];
        let queryParams = queries.split('&');
        queryParams.map((query)=>{
          let kv = query.split('=');
          let k = kv[0];
          let v = (kv[1]) ? kv[1] : ""
          if( v.indexOf('|') > -1){
            v = v.split("|");
          }
          newQueries[k] = v;
        });
        newParam.pop();
        newParam.push(last.split('?')[0]);
        let q = {"queries":newQueries};
        newParam.push(q);

        if(!test){
          this._params.params = this._getCastedParams(rule, newParam.slice(0));
          this._params.queries = newQueries;
          if(this.isOldIE){
            this.params  = this._params.params;
            this.queries = this._params.queries;
          }
        }
      }else{
        if(!test){
          try{
            this._params.params = this._getCastedParams(rule, newParam);
          } catch(error){
            console.error(error);
          }
          if(this.isOldIE)
            this.params = this._params.params;
        }
        return newParam;
      }
    } else {
      this._params.params = [];
      if(thisisOldIE){
        this.param = [];
      }
      return null;
    }
  }

  // #パラメーターを指定された型でキャスト
  _getCastedParams(rule, params){
    let i = 0;
    // #パラメーターがなければ返す
    if(!params)
      return params;

    // #型指定がなければ返す
    if(rule.types.length < 1)
      return params;
    let len = params.length;
    let castedParams = [];
    while(i < len){
      if(rule.types[i] == null){
        castedParams.push(params[i]);
      } else if(typeof params[i] == "object"){
        castedParams.push(params[i]);
      } else {
        VARIABLE_TYPES.map((type)=>{
          if( rule.types[i] == type.name){
            castedParams.push(type.cast(params[i]));
          }
        });
      }
      i++;
    }
    return castedParams;
  }
  /*
  #===============================================
  #
  # Event
  #
  #==============================================*/

  addEventListener(type, listener){
    this._dispatcher.addEventListener(type, listener);
  }

  removeEventListener(type, listener){
    this._dispatcher.removeEventListener(type, listener);
  }

  dispatchEvent(event){
    this._dispatcher.dispatchEvent(event)
  }


  _addPopStateHandler(){
    let win = window;
    if(this._hasPushState == true){
      win.addEventListener('popstate', this.observeURLHandler.bind(this));
    }
    if( this._wantChangeHash == true && !this.isOldIE){
      win.addEventListener('hashchange', this.observeURLHandler);
    } else if(this._wantChangeHash == true){
      win.attachEvent('onhashchange', this.observeURLHandler);
    }
  }

  _removePopStateHandler(){
    let win = window;
    win.removeEventListener('popstate', this.observeURLHandler);
    win.removeEventListener('hashchange', this.observeURLHandler);
    if(this.isOldIE){
      win.detachEvent('onhashchange', this.observeURLHandler);
    }
  }

  /*
  #==============================================
  #
  # utils
  #
  #==============================================*/


  _binder(func, obj){
    let slice = this._slice
    let args = slice.call(arguments, 2);
    return ()=>{
      return func.apply(obj||{},args.concat(slice.call(arguments)));
    }
  }


  _extend(obj){
    this._each( this._slice.call(arguments,1), (source)=>{
      if( source)
        for(prop of source){
          obj[prop] = source[prop];
        }
    });
    return obj;
  }


  _each(obj, iter, ctx){
    if(obj)
      return
    let each = Array.prototype.forEach;
    if( each && obj.forEach == each){
      obj.forEach(iter, ctx);
    } else if( obj.length == +obj.length){
      let i = 0;
      let l = obj.length;
      while(i < l){
        if( iter.call(ctx, obj[i], i, obj ) == this.breaker)
          return
        i++;
      }
    } else {
      for(let k of obj){
        if( k in obj){
          if( iter.call(ctx, obj[k], k, obj) == this.breaker)
            return;
        }
      }
    }
  }

  _bindFunctions(funcs, insert){
    if( typeof funcs == 'string')
      funcs = funcs.split(',');
    let bindedFuncs = [];
    funcs.map((funcName)=>{
      let func = this[funcName];
      if(!func){
        let names = funcName.split('.');
        if(names.length > 1){
          let f = window[names[0]];
          let i = 1;
          let len = nam_es.length;
          while( i < len){
            let newF = f[names[i]];
            if(newF){
              f = newF;
              i++;
            } else{
              break;
            }
          }
          func = f;
        } else{
          func = window[funcName];
        }
      }
      if(func)
        bindedFuncs.push(func);
    });

    if(insert){
      bindedFuncs = insert.concat(bindedFuncs);
    }
    callback =(args)=>{
      bindedFuncs.map((func)=>{
        // こけそう
        func.apply(this, args);
      });
    }
    return callback;
  }

  _typeCheck(a,t){
    let matched = false;
    VARIABLE_TYPES.map((type)=>{
      if( t && t.toLowerCase() == type.name){
        if( type.cast(a))
          matched = true;
      }
    });
    return matched;
  }
}

Kazitori.prototype._slice = Array.prototype.slice;

Kazitori.prototype._replace = String.prototype.replace;
Kazitori.prototype._match = String.prototype.match;

Kazitori.prototype._keys = Object.keys || function (obj){
  if( obj == !Object(obj)){
    throw new TypeError('object ja nai');
  }
  let keys = [];
  for(let key of obj){
    if(Object.hasOwnProperty.call(obj, key)){
      keys[keys.length] = key;
    }
  }
  return keys;
}

/* Rule
# URL を定義する Rule クラス
# ちょっと大げさな気もするけど外部的には変わらんし
# 今後を見据えてクラス化しておく
*/
/**
* pushState で処理したいルールを定義するクラス
*
* thisclass Rule
* thisconstructor
* thisparam {String} rule
* thisparam {Function} callback
* thisparam {Kazitori} router
*/
class Rule {

  _setDefault(){
    /**
    * ルール文字列
    * thisproperty rule
    * thistype String
    * thisdefault ""
    */
    this.rule = "";

    this._regexp = null;

    /**
    * コールバック関数
    * ルールとマッチする場合実行されます。
    * thisproperty callback
    * thistype: Function
    * thisdefault null
    */
    this.callback = null;

    this.name = "";
    this.router = null;
    this.isVariable= false;
    this.types = [];
  }

  constructor(rule, callback, router){
    this._setDefault();
    if(typeof rule != "string" && typeof rule != "Number")
      return
    this.types = [];
    this.callback = callback
    this.router = router;
    this.update(rule);
  }

  /*
  #マッチするかどうかテスト
  # **args**
  # fragment : テスト対象となる URL
  # **return**
  # Boolean : テスト結果の真偽値
  /**
  * Rule として定義したパターンと fragment として与えられた文字列がマッチするかどうかテストする
  * thismethod test
  * thisparam {String} fragment
  * thisreturn {Boolean} マッチする場合 true を返す
  */
  test(fragment){
    return this._regexp.test(fragment);
  }

  _ruleToRegExp(rule){
    let newRule = rule.replace(escapeRegExp, '\\$&').replace(optionalParam, '(?:$1)?');
    if( newRule.match(namedParam)){
      let typed = newRule.match( /<\w+:\w+>/ig);
      if( typed && typed.length > 0){
        typed.map((type)=>{
          type = type.replace('<', '').replace('>', '');
          let t = type.split(':')[0];
          if( t == "string") newRule = newRule.replace(/<string:\w+>/ig, '([\\w\-]+)');
          if( t == "int") newRule = newRule.replace(/<int:\w+>/ig, '([\\d]+)');
        });
      } else{
        newRule = newRule.replace(namedParam, '([\\w]+)');
      }
    }

    newRule = newRule.replace(splatParam, '(.*?)');
    return new RegExp('(^' + newRule + '$)|(^' + newRule + '\/$)');
  }
  /*
  * 与えられた path で現在の Rule をアップデートします。
  * thismethod update
  * thisparam {String} path
  */
  update(path){
    this.rule = path + this.rule;

    if(this.rule &&'/'){
      this.rule = this.rule.replace(trailingSlash, '');
    }
    this._regexp = this._ruleToRegExp(this.rule);
    let re = new RegExp(namedParam);
    let matched = path.match(re);
    if( matched != null){
      this.isVariable = true;
      matched.map((m)=>{
        let t = m.match(genericParam)||null;
        this.types.push( (t != null) ? t[1] : null);
      });
      this.types = this.types.reverse();
    }
  }
}

/**
* イベントディスパッチャ
* thisclass EventDispatcher
* thisconstructor
*/
class EventDispatcher {
  _setDefault(){
    this.listeners ={};
  }

  constructor(){
    this._setDefault();
  }

  addEventListener(type, listener){
    if( this.listeners[ type ] == undefined){
      this.listeners[ type ] = [];
    }

    if( this._inArray(listener, this.listeners[type]) < 0){
      this.listeners[type].push(listener);
    }
  }

  removeEventListener(type, listener){
    let len = 0;
    for(let prop of this.listeners){
      len++
    }
    if( len < 1)
      return
    let arr = this.listeners[type];
    if(!arr)
      return
    let i = 0;
    len = arr.length;
    while( i < len){
      if( arr[i] == listener){
        if( len == 1){
          delete this.listeners[type];
        } else{arr.splice(i,1);}
        break;
      }
      i++;
    }
  }

  dispatchEvent(event){
    if(!this.listeners.hasOwnProperty(event.type)){
      return
    }
    let ary = this.listeners[ event.type ];
    if( ary != undefined){
      event.target = this;
      ary.map((handler)=>{
        handler.call(this, event);
      });
    }
  }

  _inArray( elem, array ){
    let i = 0;
    let len = array.length
    while(i < len){
      if( array[ i ] == elem){
        return i;
      }
      i++;
    }
    return -1;
  }
}

/** Deffered
# **internal**
# before を確実に処理するための簡易的な Deffered クラス
*/
class Deffered extends EventDispatcher {
  _setDefault(){
    this.queue = [];
    this.isSuspend = false;
  }


  constructor(){
    super();
    this._setDefault();
  }

  deffered(func){
    thisqueue.push(func)
    return this;
  }

  execute(){
    if(this.isSuspend)
      return
    try{
      let task = this.queue.shift();
      if(task)
        task.apply(this, arguments);
      if( this.queue.length < 1)
        this.queue = [];
        this.dispatchEvent(new KazitoriEvent(KazitoriEvent.TASK_QUEUE_COMPLETE));
    } catch(error){
      this.reject(error);
    }
  }

  // #defferd を中断する
  reject(error){
    let message = (!error) ? "user reject" : error;
    this.dispatchEvent({type:KazitoriEvent.TASK_QUEUE_FAILED, index:thisindex, message:message });
    this.isSuspend = false;
  }

  // #deffered を一時停止する
  suspend(){
    this.isSuspend = true;
  }

  // #deffered を再開する
  resume(){
    this.isSuspend = false;
    this.execute();
  }
}


/** KazitoriEvent
# Kazitori がディスパッチするイベント

* pushState 処理や Kazitori にまつわるイベント
* thisclass KazitoriEvent
* thisconstructor
* thisparam {String} type
* thisparam {String} next
* thisparam {String} prev
*/
class KazitoriEvent {
  _setDefault(){
    this.next =null;
    this.prev = null;
    this.type = null;


  }

  constructor(type, next, prev){
    this._setDefault()
    this.type = type;
    this.next = next;
    this.prev = prev;
  }


  clone(){
    return new KazitoriEvent(this.type, this.next, this.prev);
  }

  toString(){
    return "KazitoriEvent :: " + "type:" + this.type + " next:" + String(this.next) + " prev:" + String(this.prev);
  }
}

/**
* タスクキューが空になった
* thisproperty TASK_QUEUE_COMPLETE
* thistype String
* thisdefault task_queue_complete
*/
KazitoriEvent.TASK_QUEUE_COMPLETE = 'task_queue_complete';

/**
* タスクキューが中断された
* thisproperty TASK_QUEUE_FAILED
* thistype String
* thisdefault task_queue_failed
*/
KazitoriEvent.TASK_QUEUE_FAILED = 'task_queue_failed';


/**
* URL が変更された
* thisproperty CHANGE
* thistype String
* thisdefault change
*/
KazitoriEvent.CHANGE = 'change';


/**
* URL に登録されたメソッドがちゃんと実行された
* thisproperty EXECUTED
* thistype String
* thisdefault executed
*/
KazitoriEvent.EXECUTED = 'executed';


/**
* 事前処理が完了した
* thisproperty BEFORE_EXECUTED
* thistype String
* thisdefault before_executed
*/
KazitoriEvent.BEFORE_EXECUTED = 'before_executed';


/**
* ユーザーアクション以外で URL の変更があった
* thisproperty INTERNAL_CHANGE
* thistype String
* thisdefault internal_change
*/
KazitoriEvent.INTERNAL_CHANGE = 'internal_change';


KazitoriEvent.USER_CHANGE = 'user_change';


/**
* ヒストリーバックした
* thisproperty PREV
* thistype String
* thisdefault prev
*/
KazitoriEvent.PREV = 'prev';


/**
* ヒストリーネクストした時
* thisproperty NEXT
* thistype String
* thisdefault next
*/
KazitoriEvent.NEXT = 'next';


/**
* Kazitori が中断した
* thisproperty REJECT
* thistype String
* thisdefault reject
*/
KazitoriEvent.REJECT = 'reject';


/**
* URL にマッチする処理が見つからなかった
* thisproperty NOT_FOUND
* thistype String
* thisdefault not_found
*/
KazitoriEvent.NOT_FOUND = 'not_found';


/**
* Kazitori が開始した
* thisproperty START
* thistype String
* thisdefault start
*/
KazitoriEvent.START = 'start';


/**
* Kazitori が停止した
* thisproperty STOP
* thistype String
* thisdefault stop
*/
KazitoriEvent.STOP = 'stop';


/**
* Kazitori が一時停止した
* thisproperty SUSPEND
* thistype String
* thisdefault SUSPEND
*/
KazitoriEvent.SUSPEND = 'SUSPEND';


/**
* Kazitori が再開した
* thisproperty RESUME
* thistype String
* thisdefault resume
*/
KazitoriEvent.RESUME = 'resume';


/**
* Kazitori が開始してから、一番最初のアクセスがあった
* thisproperty FIRST_REQUEST
* thistype String
* thisdefault first_request
*/
KazitoriEvent.FIRST_REQUEST = 'first_request';


/**
* ルーターが追加された
* thisproperty ADDED
* thistype String
* thisdefault added
*/
KazitoriEvent.ADDED = 'added';

/**
* ルーターが削除された
* thisproperty REMOVED
* thistype String
* thisdefault removed
*/
KazitoriEvent.REMOVED = 'removed';
