const sake = require('./utils');

/*
  イベントを抽象化する
*/

export default class Emitter {


  /**
    イベント機能を提供する
    @class Event
    @constructor
  */
  constructor() {
    this.listeners = {};
  }

  /*
    イベントリスナーを設定する
    @method on
    @param {String} type イベントタイプ
    @param {Function} listener イベントが発生した時に実行するリスナー
  */
  on(type, listener) {
    if(!this.listeners) this.listeners = {};

    if(this.listeners[ type ] == undefined){
      this.listeners[ type ] = [];
    }
    if(sake._inArray(listener, this.listeners[type]) < 0){
      this.listeners[type].push(listener);
    }
    return
  }

  /*
    イベントリスナーを解除する
    @method off
    @param {type} type 解除したいイベントタイプ
    @param {Function} listener 紐づくリスナー
  */
  off(type, listener){
    let len = 0;
    Object.keys(this.listeners).map((key)=>{
      len++;
    });
    if(len < 1)
      return
    let arr = this.listeners[type];
    if(!arr)
      return
    let i = 0;
    len = arr.length;
    while(i < len) {
      if(arr[i] === listener) {
        (len == 1) ? delete this.listeners[type] : arr.splice(i, 1);
        break;
      }
      i++;
    }
    return
  }


  /*
    イベントを発火する
    @method emit
    @param {Eventer} 発火するイベントオブジェクト
  */
  emit(eventObj) {
    let ary = this.listeners[ eventObj.type ];
    if(ary !== undefined){
      eventObj.target = this;
      let _this = this;
      if(eventObj.isPropagate) {
        ary.map((handler)=>{handler.call(_this, eventObj);});
      }
    }
    return
  }
}
