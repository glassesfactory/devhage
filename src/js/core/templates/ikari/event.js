const BUILDED = "builded";
const UPDATED = "updated";
export default class Event {

  /**
    イベントオブジェクト
    @class Event
  */
  constructor(type){
    this.type = type;
    this.isPropagate = true;
  }
}
