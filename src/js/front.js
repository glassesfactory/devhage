import Kazitori from './core/kazitori'
import SideList from './components/sidelist'
import EntryList from './components/list'
import EntryDetail from './components/entry'
import Paginator from './components/paginator'

import Entry from './models/Entry'
import Signal from './core/Signal'

class Router extends Kazitori{
  constructor(options){
    super(options)
  }

  index(){
    let doc = document;
    // とりあえず空にするか
    let tgt = doc.getElementById('js-content');
    if(tgt && tgt.children.length > 0){
      while(tgt.firstChild){tgt.removeChild(tgt.firstChild);}
    }
    let div = doc.createElement('div');
    // div.className = "give-me-entry";
    Entry.list()
    .then(function(result){
      Signal.notify("list_fetch", [result, 1]);
      // Signal.notify("")
    })
    .catch(function(){
      console.log("aaaa");
    });
  }

  /**
    詳細
  */
  show(id){
    console.log(id);
    Entry.fetch(id)
    .then(function(result){
      Signal.notify("detail_fetch", result);
    })
    .catch(function(error){
      console.log("noooooo", error);
    });
    paginator._clearDom();
    // Entry.fetch(id);
  }

  list(page){
    if(!page){
      page = 1;
    }
    Entry.list(page)
    .then(function(result){
      Signal.notify("list_fetch", [result, page]);
    })
    .catch(function(){
      console.log("uuuuuuu");
    });
  }

  _clickHandler(event){
    console.log("あれ?");
    event.preventDefault();
    let tgt = event.currentTarget;
    let href = tgt.getAttribute('href');
    window.router.change(href);
  }
}


let doc = document;

let sideList;
let list;
let paginator;
let detail;
window.router;
doc.onreadystatechange =()=>{
  if(doc.readyState == "complete"){
    setUp();
    sideList = new SideList();
    list = new EntryList();
    paginator = new Paginator();
    detail = new EntryDetail();
    window.router = new Router({routes:{
      "/": "index",
      "/page": "list",
      "/page/<int:page>": "list",
      "/<string:slag>": "show"
    }});

    Entry.list()
    .then(function(result){
      Signal.notify("first_list", result);
      // Signal.notify("")
    })
    .catch(function(error){
      console.log("aaaa", error);
    });
  }

}

function setUp(){
  let icon = document.getElementById('js-side-icon');
  let balloon = document.getElementById('js-side-about');

  icon.addEventListener("click", function(event){
    event.preventDefault();
    balloon.classList.add("current");
  });
}
