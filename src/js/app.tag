<app>

  <app-header />
  <main class="app-main">
    <app-list if={state=="list"} page={page} />
    <app-detail if={state=="detail"} id={currentID} />
  </main>

  <script>
    import route from 'riot-route';

    let r = route.create();

    r('/', list);
    r('/page/*', list);
    r('/*', detail);

    route.base('/');
    route.start(true);

    let self = this;

    function list(page){
      if(!page){
        page = 1;
      }
      self.update({state: "list", page: page});
    }

    function detail(id){
      self.update({state: "detail", currentID: id});
    }

    this.on("update", ()=>{
      // うーむ
      window.scrollTo(0, 0);
    });
  </script>

  <style>
    :scope {
      display: block;
    }
  </style>
</app>
