<entry>
  <div class="entry-detail">
    <article class="entry-list__entry">
      <header class="entry-header">
        <h1 ref="title"></h1>
        <div class="entry-date">{toDate(opts.data.date)}</div>
        <ul class="entry-tags">
          <li each={opts.data.tags}>
            {tag}
          </li>
        </ul>
      </header>

      <div class="entry-description" ref="desc"></div>
      <div if={opts.isdetail} class="entry-content" ref="content"></div>
    </article>
  </div>

  <script>
    toDate(date){
      date = new Date(date)
      const year = date.getFullYear()
      const month = date.getMonth() + 1
      const day = date.getDate()
      const hour = ("0" + date.getHours()).slice(-2)
      const min = ("0" + date.getMinutes()).slice(-2)
      return year + "/" + month + "/" + day + " " + hour + ":" + min
    }

    toHtml(str){
      let div = document.createElement("div");
      div.innerHTML = str;
      let codes = div.getElementsByTagName('code');
      Array.prototype.forEach.call(codes, (code)=>{
        code.innerHTML = code.innerHTML.replace(/</g, '&lt;');
      })
      return div;
    }

    let self = this;
    this.on('before-mount', function() {
      // before the tag is mounted
      if(!opts.data){
        opts.data = this.data;
        opts.id = this.data.slug;
      }
    });

    this.on("mount", ()=>{
      // 何か壮大に意味のないことをやっている気がする
      let title = opts.data.title;
      if(!opts.isdetail){
        title = '<a href="/' + opts.data.slug + '">' + opts.data.title + "</a>"
      }
      this.refs.title.innerHTML = title;
      let desc = this.toHtml(opts.data.description);
      if(desc){
        this.refs.desc.appendChild(desc);
      }
      if(opts.isdetail){
        let content = this.toHtml(opts.data.content);
        if(content)
          this.refs.content.appendChild(content);
      }
    });
  </script>

  <style>
    :scope {
      display:block;
    }
  </style>
</entry>
