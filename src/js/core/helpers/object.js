export default class ObjectHelper{
  static kv(key, obj, defaultValue){
    if(obj.hasOwnProperty(key)){
      return obj[key];
    } else {
      return (defaultValue) ? defaultValue : null;
    }
  }

  static kvCheck(keys, obj, msg){
    msg = (msg) ? msg : "プロパティが不足しています";
    keys.map((key)=>{
      if(!obj.hasOwnProperty(key)){
        throw new Error(msg);
      }
    });
  }
}
