let _store = {};
export default class MemStore {


  /*
    メモリ上に入れておく
  */
  constructor(){

  }

  static get(key) {
    //store に格納されていなければ null を返す
    if(!_store.hasOwnProperty(key)){
      return null;
    }
    return _store[key];
  }

  /*
    ストアに value をセットする。
    既に指定された key の値が存在していた場合は上書きされる
  */
  static set(key, value) {
    _store[key] = value;
    return
  }


  /*
    ストアに key が存在しなかった場合のみセットする
  */
  static default(key,value) {
    if(_store.hasOwnProperty(key))
      return null
    _store[key] = value;
    return
  }


  /*
    ストアから削除する
  */
  static del(key) {
    if(!_store.hasOwnProperty(key))
      return null;
    delete _store[key];
    return;
  }
}
