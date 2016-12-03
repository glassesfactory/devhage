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

    _sanitizeCode(line){
      line = line.replace(/<(\/)*code>/, "")
        .replace(/<(\/)*pre>/, "")
        .replace(/&quot;/g, '"')
        .replace(/&#39;/g, "'")
        .replace(/&amp;/g, "&") + "\n"
      return line;
    }

    toHtml(str){
      let result = document.createDocumentFragment();
      let tmp = "";
      let isCode = false;
      str.split("\n").forEach((line)=>{
        let toCodeClose = false;
        if(line.match(/\<pre\>/)){
          isCode = true;
          tmp = document.createElement("pre");
          tmp.appendChild(document.createElement("code"));
        }
        if(line.match(/\<\/pre\>/)){
          toCodeClose = true;
        }
        if(isCode){
          line = this._sanitizeCode(line);
          tmp.childNodes[0].appendChild(document.createTextNode(line));
        } else {
          let div = document.createElement("div");
          div.innerHTML = line;
          if(div.childNodes[0]){
            result.appendChild(div.childNodes[0]);
          }
        }
        if(toCodeClose){
          isCode = false;
          result.appendChild(tmp);
        }

      });
      return result;
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
