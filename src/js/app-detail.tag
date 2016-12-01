<app-detail>
  <div if={enable}>
    <entry data={data} isdetail={true} id={opts.id} />
  </div>

  <script>
    import Entry from './models/entry';

    let self = this;
    self.data = null;

    this.on('mount', ()=>{
      let id = opts.id;
      Entry.fetchData(id)
      .then(function(result){
        self.update({data: result, enable: true});
        document.title = result.title + " - デブハゲ";
      })
      .catch(function(error){
        console.log("noooooo", error);
      });
    });
  </script>
</app-detail>
