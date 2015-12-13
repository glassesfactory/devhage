import utils from "./utils"
import Config from "./config"
import Parser from "./parser"

const prefix   = Config.prefix

const statements = Config.statements

const options    = Config.options

const singleTags  = Config.singleTags


export default class Dom {

  constructor(el, vm){
    this._setupDefault();
    this.el = el;
    this.vm = vm;
    this.children = [];
    if(this.el.nodeType == 3){
      this.isText = true
    } else {
      this.tagName = this.el.tagName.toLowerCase();
      this.isSingleTag = (singleTags.indexOf(this.tagName) > -1);

      this.klsName = Parser.klsParser(this.el.className);
      this.idName = this.el.id;
      this.elName = this._buildElName();
    }
  }

  _setupDefault(){
    this.el = null;

    this.vm =  null;

    this.tagName = null;

    this.klsName = null;

    this.idName = null;

    this.elName = null;

    this.isSingleTag = false;

    // #最初
    this.preStatement = null;

    // #大体閉じる
    this.appendStatement = null;


    this.children = null;

    this.hasLoop = false;

    this.hasIf = false;

    this.hasDirective = false;

    this.valOnly = false;

    this.isText = false;
    this.isContainer = false;
    this.parent = null;

    this.inLoop = false;
  }

  /**
    性格付け
    @method bind
  */
  bind(args, ignores, parent){
    if(this.isText){
      return args;
    }

    let attributes = this.el.attributes;
    this.attributes = "";
    if(parent && (parent.hasLoop || parent.inLoop)){
      this.inLoop = true;
    }

    for( let i = 0; i < attributes.length; i++){
      let attr = attributes[i];
      if(!attr.name.match(prefix + "-"))
        this.attributes += " " + attr.name + '="' + Parser.parseText(attr.value, args, ignores, this.inLoop) + '"';

      let hasStatements = statements.indexOf(attr.nodeName.replace(prefix + "-", ""));
      if(hasStatements > -1){
        let statement = statements[hasStatements];
        if(statement == "loop") this.hasLoop = true;
        if(statement == "if") this.hasIf   = true;
        if (statement == "on") this.hasDirective = true;
      }

      let hasOptions = options.indexOf(attr.nodeName.replace(prefix + "-", ""));
      if(hasOptions > -1) {
        let opt = options[hasOptions];
        if(opt == "val-only")
          this.valOnly = true;
      }

    }

    if(this.hasLoop && this.hasIf){
      throw new Error("同時に指定はできませんよ。できないんです。勘弁して下さい。");
    }


    // #うーむ…
    if(this.hasLoop) {
      let str = this.el.getAttribute(prefix + "-" + "loop");
      let loopSet = Parser.loop(str);
      if(loopSet["key"].indexOf('.') < 0 && !this.inLoop)
        args.push(loopSet["key"]);
      if (!this.inLoop){
        // # ルートがコンパイラ引数に登録されているかチェックし、なければ登録する。
        let root = loopSet["key"].split('.')[0];
        if(utils._inArray(root, args) < 0) args.push(root);
      }
      ignores.push(loopSet["item"]);
      if(loopSet){

        let counter = "i" + this.vm.builder.incrementer;

        this.vm.builder.incrementer++;
        let loopkey =  loopSet["key"];
        let key = "this.datas";
        if(loopkey.indexOf('.') > 0){
          let keys = loopkey.split('.');
          key = keys[0];
          if(!this.inLoop){
            key = "this.datas['" + key + "']"
          }
          for(let j = 1; j < keys.length; j++){
            key += "['" + keys[j]  + "']";
          }
        } else {
          key = "this.datas['" + loopkey + "']";
        }
        this.preStatement = "for( var " + counter + " = 0; " + counter + " < " + key + ".length; " + counter + "++){ var " + loopSet["item"] + " = " + key + "[" + counter + "];";
        this.appendStatement = "};";
      }
    }
    if(this.hasIf){
      let str = this.el.getAttribute(prefix + "-" + "if");
      this.preStatement = "if(" + str + "){";
      this.appendStatement = "};";
    }

    // #ディレクティブがあるならパースしとく
    if(this.hasDirective){
      this._parseDirective();
    }

    return args
  }


  _parseDirective(){
    // #複数指定するときどうするかね
    let str = this.el.getAttribute(prefix + '-' + 'on');
    let directives = str.split(',');
    directives.map((str)=>{
      let directive = str.split(':');
      let action = directive[0];
      let method = directive[1];
      this.vm._methodsMap.push({
        path: this._getPath(),
        action: action,
        method: method
      });
    });

  }


  _getPath(){
    let parent = this.parent
    let path = this.elName;
    while(parent){
      path = parent.elName + ' ' + path;
      parent = parent.parent;
    }
    return path;
  }


  _buildElName(){
    let elName = this.tagName;
    if(this.idName){elName += '#' + this.idName;}
    if(this.klsName){elName += '.' + this.klsName;}
    return elName;
  }


  /**
    ラインを組み立てる
    @method build
  */
  build(lines){
    this._preBuild(lines, this.inLoop);
    this.children.map((child)=>{
      if(this.hasLoop || this.inLoop){
        child.inLoop = true;
      }
      child.build(lines);
    });
    this._appendBuild(lines);
  }


  /**
    開始
    @method _preBuild
    @private
  */
  _preBuild(lines){
    // #nodeType が 3 だったら
    if(this.preStatement){
      lines.push(this.preStatement);
    }
    if(this.isText){
      // #ie8 は textContent がないので nodeValue
      // #ややこしい判定も IE8 は hasOwnproperty を Object インスタンスが何故か持っていないのでプロトタイプから直接呼び出し。
      let val = (Object.hasOwnProperty.call(this.el, "textContent")) ? this.el.textContent : this.el.nodeValue;
      lines.push("p.push('" + Parser.parseText(val, this.vm.builder.args, this.vm.builder.ignores, this.inLoop) + "');");
    } else {
      if(!this.valOnly){
        lines.push("p.push('<" + this.tagName + this.attributes + ">');");
      }
    }
  }


  /**
    終了
    @method _appendBuild
    @private
  */
  _appendBuild(lines){
    if(this.isText)
      return
    if(!this.valOnly) {
      if(!this.isSingleTag)
        lines.push("p.push('</" + this.tagName + ">');");
    }
    if(this.appendStatement)
      lines.push(this.appendStatement);
  }
}
