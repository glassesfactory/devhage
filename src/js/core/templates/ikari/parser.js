// #ぱてぃーん
const VAL_RE     = /\{{2,3}( )*([\w\[\]\(\)]+|([\w\[\]\(\)]+\.)+[\w\[\]\(\),\s]+)( )*\}{2,3}/g;

const TERNARY_RE = /\{{2,3}( )*([\w"'\[\]\(\)]+|[\w\[\]\(\,\)]+\.+[\w\[\]\(\)]+)( )*([><\=])+( )*([\w\[\]\(\)]+|[\w\[\]\(\)]+\.+[\w\[\]\(\)]+)( )*\?( )*([\w"'\[\]\(\)]+|[\w\[\]\(\)]+\.[\w\[\]\(\)]+)( )*\:( )*([\w"'\[\]\(\)]+|([\w\[\]\(\)]+\.)+[\w\[\]\(\)]+)( )*\}{2,3}/g;

let _getValName = (val)=>{
  return val.split("{").join('').split(' ').join('').split("}").join('');
}

let _valSplitter = (valName, data)=>{
  let vs = valName.split('.').slice(1)
  let d = data;
  vs.map((v)=>{
    if(d.hasOwnProperty(v)){
      d = d[v];
    }
  });
  return d;
}

let Parser = {

  loop: (str)=>{
    let spacer = str.split(' ');
    if(spacer && spacer.length > 0){
      let isForIn = true;
      let key = spacer[2];
      let item = spacer[0];
      return {
        key: key,
        item: item
      }
    }

    let colon = str.split(':');
    if(colon && colon.length > 0){
      let key = colon[1];
      let item = colon[0];
      return {
        key: key,
        item: item
      }
    }
    let key = str;
    return {
      key: key,
      item: "item"
    }
  },

  if: (str)=>{
    return str;
  },

  klsParser:(target)=>{
    target = Parser.literalClear(target);
    let klses = target.split(' ');
    let result = klses.join('.');
    return result;
  },


  literalClear:(target)=>{
    target = target.replace(/\{{2,3}( )*([\w\[\]\(\)]+|([\w\[\]\(\)]+\.)+[\w\[\]\(\),\s]+)( )*\}{2,3}/g, "");
    return target;
  },



  /**
    本文内にいるやつをパースする
    @method parseText
    @param txt {String} txt
  */
  parseText:(txt, args, ignores, inLoop)=>{
    if(!txt)
      return
    let match = txt.match(VAL_RE);
    if(!match)
      return Parser.parseTernary(txt, args, ignores, inLoop);

    match.map((valStr)=>{
      let isUnsafe = false;
      if(valStr.match(/\{{3}/g))
        isUnsafe = true;
      let val = valStr.split("{").join("").split(" ").join("").split("}").join("");

      Parser._argsCheck(args, ignores, val);
      if(!inLoop && val.indexOf("this.") < 0){
        val = "this.datas." + val;
      }
      let insertVal = (isUnsafe) ? "' + " + val + "+ '" : "'+ this.safe(" + val + ") + '";

      txt = txt.replace(valStr, insertVal);
    });
    return txt;
  },

  parseTernary: (txt, args, ignores, inLoop)=> {
    let match = txt.match(TERNARY_RE)
    if(!match){
      return txt;
    }
    let isUnsafe = false;
    if(txt.match(/\{{3}/g))
      isUnsafe = true;
    let ternary = txt.split("{").join("").split(" ").join("").split("}").join("");
    if(isUnsafe){
      txt = "' + " +  txt + "+ '";
    } else {
      let ternaries = ternary.split("?");
      let statement = ternaries[0];
      let vals      = ternaries[1].split(":");
      vals.map((val)=>{Parser._argsCheck(args, ignores, val);});
      let key = vals[0];
      if(!inLoop && val.indexOf("this.") < 0){
        key = "this.datas." + key;
      }
      txt = "' + " + statement + "? this.safe(" + key + ") : this.safe(" + vals[1] + ") + '";
    }
    return txt;
  },

  _argsCheck:(args, ignores, val)=>{
    let key = val.split('.')[0];
    if(args.indexOf(key) == -1 && key != "this" && ignores.indexOf(key) == -1 && key.indexOf('"') == -1){
      args.push(key);
    }
  }

}

export default Parser
