<app-detail>
  <div if={enable}>
    <app-entry data={data} isDetail={true} id={opts.id} />
  </div>

  <script>
    import Entry from './models/entry';
    // r = route.create();
    // r('/*', detail);
    //
    let self = this;
    self.data = null;
    // function detail(id){
    // console.log("うげ", id)

    this.on('mount', ()=>{
      let id = opts.id;
      Entry.fetchData(id)
      .then(function(result){
        self.data = result;
        self.enable = true;
        self.update();
        document.title = result.title + " - デブハゲ";
      })
      .catch(function(error){
        console.log("noooooo", error);
      });
    });
  </script>
</app-detail>
