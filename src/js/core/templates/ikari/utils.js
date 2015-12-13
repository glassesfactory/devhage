let util = {
  /**
    対象オブジェクトが指定された key の値を持っていたら返す。
    なければ null を返す
    @method kv
    @param key {String} 取得したい key 文字列
    @param obj {Object} 存在を確認したい Object
  */
  kv:(key, obj, defaultValue)=>{
    if(obj.hasOwnProperty(key)){
      return obj[key];
    } else {
      return (defaultValue) ? defaultValue : null;
    }
  },


  /**
    継承する
  */
  extend:(obj)=>{
    let len = arguments.length;
    let arg = slice.call(arguments, 1);
    arg.map((item)=>{
      if(item){
        for(prop of item){
          obj[prop] = item[prop];
        }
      }
    });
    return obj;
  },


  /**
    dom の掃除
  */
  erase:(el)=>{
    while(el.firstChild){el.removeChild(el.firstChild);}
    return el;
  },


  /**
    配列の中に入っているかどうか
    @method _inArray
  */
  _inArray: ( elem, array )=>{
    let i = 0;
    let len = array.length;
    while(i < len ){
      if(array[ i ] == elem)
        return i;
      i++;
    }
    return -1;
  },

  /**
    セレクタ取ってくる
    @method query
  */
  query: (q)=>{
    return (typeof q == "string") ? document.querySelector(q) : q;
  }
}

export default util
