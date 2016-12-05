#Riot.js の Scoped な CSS に無理やり外部 CSS を import させる

[前回の記事で](https://dev.hageee.net/riot) 長くなったから省いた、  
Riot.js の Scoped な CSS について、解説がてら所感を語ろうと思っていたことがいくつかあった。

ので、この土日で適当な UI サンプルを作りつつ  
記事を書いていたのだけれど思わぬところで躓いて(調査不足)、  
最終的に夜中に力技で解決するという悪手に出たので  
一応報告メモとして記事を書いた。

## meta

- slug: riot_bad_hack
- date: 2016-12-05 01:20
- tags: riot,js,cssnext
- active: true

## content

## 何したの

Scoped な CSS がどういうものなのかを含め、  
UI サンプルも交えて作っていた。

先にネタバラシをすると
CSS Variables を活用しつつ、  
変数を外部 CSS に記述してそいつを外から流し込めば色々スッキリするじゃん  
と考えていたのだけれど、思ったように行かなかった。

そもそも Riot の Scoped な CSS で CSS Variables 等々、
CSSNext なことは以下の記事を読むと出来るようになる。

* [ES6で書くRiot - riot.config.js編](http://qiita.com/cognitom/items/200a96b86eafc463ed24)
* [ES6で書くRiot - Rollup編](http://qiita.com/cognitom/items/c20c22614560627062cb)

途中、この記事も書いている OSC のマスターから助言を頂いたのだが、  
`@import` を現代的に解釈する `postcss-import` と  
`postcss-cssnext` を並列して使うことができなかった。

原因は `postcss-import` が async only になったこと。  
ご丁寧に `process.then(cb)` しろとエラーまではいてくる。

あわよくば Riot.js Advent Calendar にもう1本投稿しようと考えていたのだが、  
出鼻をくじかれた気分だ。

最初は `postcss-import` や、`rollup-riot-plugin` や `riot-compiler` の  
ソースを読んだりしてなんとかならないかと探っていたが、  
`postcss-import` のリポジトリで以下の issue のやり取りを見て心が折れた。

> [Sync mode?](https://github.com/postcss/postcss-import/issues/180)

おんなじこと思ってるやつが世の中には他にいたんだ、  
なんとかなるかもしれないと思ったが以下の回答。

> No way. Postcss plugins should be async only (where it's possible).



> No way.


そうですか。

色々天秤にかけて async/await なども試したが  
結果、バグやもっと考えなければいけないことはおそらくあるだろうが、  
取り急ぎ同期的に無理やり `@import` 構文で CSS をねじりつけるメソッドを書いた。


    function syncImport(css){
      let lines = css.split('\n');
      let result = "";
      lines.forEach((line)=>{
        if(line.match(/@import/)&&!line.match(/\/\*/)){
          let filename = line.replace(/\s/g, '').replace(/@import(\s)*url\('/, '').replace(/'\);/, '');
          if(!filename){
            return;
          }
          let file = fs.readFileSync(path.join(__dirname, filename), "utf8");
          result += file;
        } else {
          result += line + '\n';
        }
        });
        return result;
    }

悲しみにかまけて書いたので色々汚いのはゴメーンね。  
もし使うのであれば `fs` と `path` モジュールは別途インポートしてください。


以下のように Riot.js の `<style>` タグの  
cssnext を解釈させるコードの前に滑り込ませて使う。


    function cssnext(tagName, css){
      css = css.replace(/:scope/g, ':root');
      css = syncImport(css);
      css = postcss([postcssCssnext]).process(css).css;
      css = css.replace(/:root/g, ':scope');
      return css;
    }


例えば以下のような style.css を

    :root {
      --like-theme: {
        color: #ffffff;
        background-color: #4990E2;
      };
      --dislike-theme: {
        color: #ffffff;
        background-color: #D0011B;
      }
    }


Riot で以下のように書く。


    <my-tag>
      <style>
        @import url('./src/style.css');
        .like {
          @apply --like-theme;
        }
        .dislike {
          @apply --dislike-theme;
        }
      </style>
      <div>
        <ul>
          <li class="like">1234</li>
          <li class="dislike">1234</li>
        </ul>
      </div>
    </my-tag>


こいつをコンパイルするとこうじゃ。

![さてはアンチだなオメー](http://devhage.s3.amazonaws.com/images/anti.png)

こんな風に一括でテーマ指定のようなことができる。
外部ファイル化しているということは、別途別に Scoped じゃなくてもいい用の CSS に対しても、  
同じ変数を使用して一気に変更を書けることができるということだ。

変数は global に管理してるけどローカルで Scoped な CSS に落とし込むって  
なんだか強そうなものが生まれた。

ちなみに Polymer だと最初から親やルートで変数を定義して子供が使うことが出来たりする…  
興味がある人は調べてみるといい。

とりあえず殴りがいたことを殴りがいた。  
おやすみ世界。


**追記**

起きて冷静になって考えたらここまでやるなら  
そもそも rollup じゃなくて gulp 使えばいいんじゃないか

という気もしつつ、必要なのはここだけなのでそれもなんだかなぁという気分になった。

とは言え、 issue のやり取りにあった

> Postcss plugins should be async only (where it's possible).

という一文を考えると、おいおい `riot-compiler` なのか、  
`rollup-riot-plugin` なのかは分からないが非同期に対応していくとは思うので  
多少力任せなコードでもつなぎと考えればまぁ良しとしようと思った。

async/await がもっと気軽に使えるようになればこの手の問題はほぼほぼ解決すると思うのではよ。
