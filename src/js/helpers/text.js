export default class TextHelper {

  static encode(str){}

  static decode(encoded){
    if(!encoded){
      return;
    }
    let str = encoded.replace(/&lt;/g, "<").replace(/&gt;/g,">").replace(/&nbsp;/g, " ").replace(/&quot;/g, '"').replace(/&amp;/g, "&").replace(/&#039;/g, "'");
    return str;
  }
}
