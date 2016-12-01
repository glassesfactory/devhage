import ObjectHelper from '../helpers/object';
import TextHelper from '../helpers/text';

class Entry {


  /**
    でーた
  */
  constructor(obj){
    this._setupDefault();
    this._fromObject(obj);
  }

  _setupDefault(){
    // でふぉるとストラクチャファイル(json)から生成するようにする?
  }

  _fromObject(obj){
    this.slug = ObjectHelper.kv("slug", obj);
    this.title = ObjectHelper.kv("title", obj);
    this.description = ObjectHelper.kv("description", obj);
    this.createdAt = ObjectHelper.kv("created_at", obj);
    this.content = ObjectHelper.kv("content", obj);
    this.date = ObjectHelper.kv("date", obj);
    this.tags = ObjectHelper.kv("tags", obj, []);
  }

  save(){
    this.description = TextHelper.decode(this.description);
    this.content = TextHelper.decode(this.content);
  }

  static _find(page){

  }

  /*
    取得する
  */
  static fetchData(slug){
    let url = "/data/" + slug + ".json";
    let promise = new Promise((resolve, reject)=>{
      if(Entry.collection.hasOwnProperty(slug)){
        resolve(Entry.indexed[id]);
      } else {
        fetch(url)
        .then((res)=>{
          if(!res.ok){
            reject(res);
          }
          res.json().then((data)=>{
            let model = new Entry(data);
            model.save();
            resolve(model);
          }).catch(()=>{
            reject();
          });
        });
      }
    });
    return promise;
  }

  static list(page){
    if(!page){
      page = 1;
    }
    // inner find
    let result = Entry._find(page);
    // データがすでにある
    if(result){
      let promise = new Promise((resolve, reject)=>{
        resolve(result);
      })
      return promise;
    }
    let url = "/data/list/all.json";
    let promise;
    if(Entry.listLoaded){
      promise = new Promise((resolve, reject)=>{
        let start = (page - 1) * 5;
        let end = page * 5;
        let result = Entry.collection.slice(start, end);
        resolve(result);
      });
      return promise;
    } else {
      promise = new Promise((resolve, reject)=>{
        fetch(url)
        .then((res)=>{
          if(!res.ok){
            reject();
            return
          }
          res.json().then((data)=>{
            Entry.listLoaded = true;
            let tmp = [];
            // うーん
            Entry.count = data.data.length;
            data.data.forEach((item)=>{
              let model = new Entry(item);
              tmp.push(model);
              model.save();
              Entry.collection.push(model);
            });
            let start = (page - 1) * 5;
            let end = page * 5;
            let result = tmp.slice(start, end);
            resolve(result);
          }).catch(()=>{
            reject();
          });
        });
      });
      return promise;
    }
  }
}

Entry.count = 0;
Entry.collection = [];
Entry.indexed = {};

export default Entry
