const request = require('../core/xhr');
const Emitter = require('../core/emitter');
const ObjectHelper = require('../core/helpers/object');
const TextHelper = require('../core/helpers/text');
const Config = require('../../../config.json')


class Entry extends Emitter{


  /**
    でーた
  */
  constructor(obj){
    super();
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
    // Entry.collection.push(this);
    // Entry.indexed[this.slug] = this;
  }

  static _find(page){

  }

  /*
    取得する
  */
  static fetch(slug){
    let url = "/data/" + slug + ".json";
    let promise = new Promise((resolve, reject)=>{
      if(Entry.collection.hasOwnProperty(slug)){
        resolve(Entry.indexed[id]);
      } else {
        request.get(url)
        .end((err, res)=>{
          if( err != null || !res.body){
            reject();
            return;
          }
          let entry = res.body;
          let model = new Entry(entry);
          model.save();
          resolve(model);
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
    if(Entry.listLoaded){
      let promise = new Promise((resolve, reject)=>{
        let start = (page - 1) * 5;
        let end = page * 5;
        let result = Entry.collection.slice(start, end);
        console.log(result);
        resolve(result);
      });
      return promise;
    } else {
      let promise = new Promise((resolve, reject)=>{
        request.get(url)
        .end((err, res)=>{

          if(err != null || !res.body){
            reject();
            return
          }
          Entry.listLoaded = true;
          let data = res.body.data;
          let count = res.body.count;

          Entry.count = count;
          let tmp = [];

          data.map(function(item){
            let model = new Entry(item);
            tmp.push(model);
            model.save();
            Entry.collection.push(model);
          });
          let start = (page - 1) * 5;
          let end = page * 5;
          let result = tmp.slice(start, end);
          resolve(result);
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
