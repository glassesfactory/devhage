/*
  シグナル
*/
class Signal {
  constructor(){}

  /*
    シグナルを送信する
    @method notify
    @static
    @param {String} signal 送信したいシグナル文字列
    @param args {Array} なんか引数混ぜる
  */
  static notify(signal, args){
    var cbs = Signal.subscriber[signal];
    if(!cbs) return
    cbs.map((cb)=>{
      if(cb){
        cb(signal, args);
      }
    });
  }


  /**
    シグナルの通知を待ち受ける
    @method subscribe
    @static
    @param {String} signal 受信を待ち受けたいシグナル
    @param {Function} callback 受信した時に実行したい処理
  */
  static subscribe(signal, callback) {
    if(!Signal.subscriber[signal])
      Signal.subscriber[signal] = [];
    Signal.subscriber[signal].push(callback);
  }


  /**
    受信待受を解除する
    @method unsubscribe
    @static
    @param {String} signal 受信を解除したいシグナル
    @param {Function} callback 受信を解除したい処理
  */
  static unsubscribe(signal, callback) {
    // signal がそもそも登録されてなかった場合は返す
    if(!Signal.subscriber.hasOwnProperty(signal))
      return

    let i = 0;
    let arr = Signal.subscriber[signal];
    let len = arr.length;
    while(i < len) {
      var cb = arr[i];
      if(cb == callback){
        //0になる時はシグナルごと削除する
        (len == 1) ? delete Signal.subscriber[signal] : arr.splice(i, 1);
        break;
      }
      i++;
    }
  }
  // @alerm:(time=0)->
}
Signal.subscriber = {};

export default Signal
