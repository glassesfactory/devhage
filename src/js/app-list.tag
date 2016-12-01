<app-list>
  <entry each={data} />
  <pagenator next={next} prev={prev} />
  <script>
    let self = this;
    import Entry from './models/entry';

    generatePagenator(page){
      let limit = 5;
      if(Entry.count < (limit + 1)){
        return {};
      }
      let count = Entry.count;
      let prev = null;
      let next = null;
      if(page > 1){
        prev = page - 1;
      }

      let maxPage = count / limit;

      if(count % limit > 0 && count > limit){
        maxPage = parseInt(maxPage) + 1;
      }
      if(maxPage != page && maxPage > page){
        next = page + 1;
      } else {
        next = null;
      }
      return {next: next, prev: prev}
    }

    fetchAndRender(page){
      Entry.list(page)
      .then(function(result){
        let pagenator = self.generatePagenator(page);
        let data = result.map((entry)=>{
          return {data: entry};
        });

        let ctx = {data: data};
        if(pagenator){
          ctx = Object.assign(ctx, pagenator);
        }
        self.update(ctx);
      })
      .catch(function(error){
        console.log("uuuuuuu", error);
      });
    }

    this.on("mount", ()=>{
      let page = opts.page;
      if(!page){
        page = 1;
      }
      this.fetchAndRender(page);
    });

    this.on("update", ()=>{
      // なんか間違ってる気がする
      // observable がどうのとかあったからそっちか?
      if(opts.page && this.page != opts.page){
        opts.page = parseInt(opts.page);
        this.page = opts.page;
        this.fetchAndRender(opts.page);
      }
    });


  </script>
</app-list>
