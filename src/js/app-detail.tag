<app-detail>
  <div if={enable}>
    <app-entry data={data} />
  </div>

  <script>
    console.log("（｀ェ´）ﾋﾟｬｰ")
    r = route.create();
    r('/*', detail);
    //
    let self = this;
    function detail(id){
      Entry.fetchData(id)
      .then(function(result){
        self.data = result;
        self.update();
        document.title = result.title + " - デブハゲ";
      })
      .catch(function(error){
        console.log("noooooo", error);
      });
    }
  </script>
</app-detail>
