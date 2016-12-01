<app>

  <app-header />
  <main>
    <app-list if={state=="list"} />
    <app-detail if={state=="detail"} />
  </main>

  <script>
    import route from 'riot-route';
    import Entry from './models/entry';
    let r = route.create();


    r('/', list);
    r('/*', detail);
    // r(list);
    route.base('/');
    route.start(true);
    // this.state = "list";
    let self = this;
    function list(){
      self.state = "list";
      let page = "1";
      if(!page){
        page = 1;
      }
      Entry.list(page)
      .then(function(result){
        // Signal.notify("list_fetch", [result, page]);
        self.update();
      })
      .catch(function(){
        console.log("uuuuuuu");
      });
    }

    function detail(id){
      self.state = "detail";
    }
  </script>

  <style>
    :scope {
      display: block;
    }
  </style>
</app>
