const request = require('../core/xhr');
const Emitter = require('../core/emitter');
const ObjectHelper = require('../core/helpers/object');
const TextHelper = require('../core/helpers/text');
const Config = require


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
    this.tags = ObjectHelper.kv("tags", obj);
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
    let url = "https://s3-ap-northeast-1.amazonaws.com/devhage/data/" + slug + ".json";
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
    let url = "https://tl7y10l7jd.execute-api.ap-northeast-1.amazonaws.com/prod/entries/page/" + page;
    let promise = new Promise((resolve, reject)=>{
      request.get(url)
      .end((err, res)=>{

        if(err != null || !res.body){
          reject();
          return
        }
        let data = res.body.data;
        let count = res.body.count;

        Entry.count = count;
        let result = [];
        data.map(function(item){
          let model = new Entry(item);
          result.push(model);
          model.save();
        });
        resolve(result);
      });
    });
    return promise;
  }
}

Entry.count = 0;
Entry.collection = [];
Entry.indexed = {};

export default Entry