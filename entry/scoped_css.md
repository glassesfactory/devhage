# Riot.js の Scoped な CSS について考えてみた 前編

先にこの記事を書き始めていたのだけれど、  
思わぬところで躓いたせいで  
この記事のネタバレ?に近いことを[前回](https://dev.hageee.net/riotbadhack) の記事で書いてしまった。  
ので、既にある程度 JS や CSS の実装が得意な人は前回の記事だけ読んで  
あとは自分で考えてもらったほうが早いかもしれない。  

Scoped CSS がなぜ必要なのか、何の役に立つのか、  
Scoped CSS で綺麗に設計するにはどうしたら良いか  
ネタを欲している人などは以下からを読み進めて欲しい。

## meta

- slug: scopedcss_first
- date: 2016-12-11 11:11
- tags: riot, css
- active: true

## content

## Scoped CSS がアルトベンリな状況

前回も前々回も Scoped な CSS について、  
ろくに説明していなかったので今度はちゃんと書く。

例えば以下のような css があるとする。

<h6 class="hl-filename">main.css</h6>
```css
.cat:before {
  content: "🐈";
}
```

<h6 class="hl-filename">index.html</h6>
```html
<div class="cat"></div>
```

これをブラウザで実行すると言うまでもなく以下のようになる。

![nya-n](http://devhage.s3.amazonaws.com/images/nya-n.png)

たとえばこの HTML に別な人間が書いた、`sub.css` が追加されたとする。  
`sub.css` には以下のコードが書かれている。

<h6 class="hl-filename">sub.css</h6>
```css
.cat:before {
  content: "🐕";
}
```

するとどうだろう。  
どうだろうというか当たり前なのだが犬に変わってしまった。

![innu](http://devhage.s3.amazonaws.com/images/innu.png)

何を今更わかりきったことをと思うだろうが、  
要するに実案件で CSS がコンフリクトしているような状況を再現している  
と思ってもらえたら幸いだ。

CSS がコンフリクトしてしまいがちな条件としては

* 冗長化を避けるがゆえの単純な CSS の命名
* ドキュメントや既存のソースを一切読まないやつの存在

が主だって挙げられると思われる。

命名規則に関しては昔からプレフィクスをつけるなり、  
近年では BEM を始めとした、体系化された命名規則など  
様々な対策が考案され続けてきた。

ドキュメントに関しても、ヒアドキュメントを生成するツールを  
導入したり、やれることはたくさんあるのだが  
それでも読まないやつは読まない。

同じチーム内であれば命名規則を練り合わせるなり、  
きちんとドキュメント化しつつ、仕様を把握してもらうことを啓蒙することはできる。

しかし、チーム同士に縦横のつながりが一切ない場合は  
なかなかそうも行かない。

こちらがサイト全体向け共通パーツの提供元となった場合には、  
なおさらそう簡単に影響を受けるわけにも行かない。

CSS の規模が膨らみ始める中規模以上の開発はもちろん、  
そういった簡単には影響を受けたくない場合にも  
Scoped な CSS は活躍してくれるはずだ。

この Scoped な CSS は Riot 独自の仕組みというわけではなく、  
次世代の CSS の仕様として検討されている。

Riot や Polymer など一部のフレームワークでは、  
先行してこの Scoped な CSS を扱うことができるようになっている。

Scoped な CSS を使える前提で設計できるのであれば、  
ヤサイマシマシメンカタメのような長い名前のクラスなどを定義する必要も、  
mi6 だか pd15 だかどこかの暗号のような略語なんだか闇の組織なんだか
謎の英字と数字の組み合わせのクラスで塗れる必要も大いに減って、  
端的でわかりやすい命名規則でスタイリングすることができる。


## Scoped な CSS を試してみる

では早速 Riot の Scoped な CSS を試してみたいと思う。  

<h6 class="hl-filename">cat.tag</h6>
```js
<Cat>
  <style>
    :scoped {
      display: block;
    }
    .cat:before {
      content: "🐈";
    }
  </style>
  <div class="cat"></div>
</Cat>
```


これを実際にマウントしてみる。

<h6 class="hl-filename">app.tag</h6>
```js
<app>
  <style>
    :scope {
      display: block;
    }
  </style>
  <Cat></Cat>
</app>
```

<h6 class="hl-filename">main.js</h6>
```js
import riot from 'riot';

import './app.tag';
import './cat.tag';

'use strict';

riot.mount('app');
```

<h6 class="hl-filename">index.html</h6>
```html
<!doctype html>
<html lang="ja">
  <head>
    <meta charset="utf-8">
    <style>
      html, body, h1, h2, h3, h4, h5, h6, p {
        margin: 0;
        padding: 0;
      }
    </style>
  </head>
  <body>
    <app></app>
    <script type="text/javascript" charset="utf-8" src="/dist/main.js"></script>
  </body>
</html>
```

rollup や riot コマンドでビルドして supersptatic などを使いつつ、  
index.html をブラウザで開くと最初のサンプル同様、  
猫が出力される。

![nya-n](http://devhage.s3.amazonaws.com/images/nya-n.png)

では試しにこの index.html に CSS のクラスを追加してみよう。

```css
.cat:before {
  content: "🐕";
}
```

無事猫のまま表示されたと思う。

## Riot のタグ同士の Scope

次は Riot のタグ同士での Scope を考えてみる。

先程の Cat タグを以下のように変えた。

<h6 class="hl-filename">cat.tag</h6>
```js
<Cat>
  <style>
    :scope {
      display: block;
    }
    .cat:before {
      content: "🐈";
    }
    h1 {
      font-size: 20px;
    }
  </style>
  <div class="cat">
    <h1>h1 text</h1>
  </div>
</Cat>
```

さらに新しく Dog タグを追加してマウントしてみる。

<h6 class="hl-filename">dog.tag</h6>
```js
<Dog>
  <style>
    :scope {
      display: block;
    }
    .cat:before {
      content: "🐕";
    }
    h1 {
      font-size: 40px;
    }
  </style>
  <div class="cat">
    <h1>h1 text</h1>
  </div>
</Dog>
```

<h6 class="hl-filename">app.tag</h6>
```js
<app>
  <style>
    :scope {
      display: block;
    }
  </style>
  <Cat />
  <Dog />
</app>
```

同じような CSS セレクタを使っているにも関わらず、  
それぞれのスタイルが維持されているはずだ。

![イッヌとネッコ](http://devhage.s3.amazonaws.com/images/cats_dog.png)

## Scoped な CSS を持ったタグのネスト

では、Cat タグと Dog タグをネストする例を考えてみよう。
それぞれをマウントしている app タグと Cat タグを以下のように変えてみた。

<h6 class="hl-filename">app.tag</h6>
```js
<app>
  <style>
    :scope {
      display: block;
    }
  </style>
  <Cat>
    <Dog></Dog>
  </Cat>
</app>
```

<h6 class="hl-filename">cat.tag</h6>
```js
<Cat>
  <style>
    :scope {
      display: block;
    }
    .cat:before {
      content: "🐈";
    }
    h1 {
      font-size: 20px;
    }
  </style>
  <div class="cat">
    <h1>h1 text</h1>
    <yield/>
  </div>
</Cat>
```

するとそこまでの変化は無いはずだ。  
では、試しに Cat タグの h1 へのスタイリングを少し追加してみよう。

<h6 class="hl-filename">cat.tag</h6>
```js
<Cat>
  <style>
    :scope {
      display: block;
    }
    .cat:before {
      content: "🐈";
    }
    h1 {
      font-size: 20px;
      color: #ee00000;
    }
  </style>
  <div class="cat">
    <h1>h1 text</h1>
    <yield/>
  </div>
</Cat>
```

ある意味普通の CSS 通りの挙動ではあるが、  
ネストされている Dog タグにも影響が出てしまった。

![nest](http://devhage.s3.amazonaws.com/images/aka.png)

これでは困る。  
`yield` を使うと不特定の何かをコンポジションできるという  
メリットはあるが、CSS の影響が出てしまうのは喜ばしくない。

ネストされる Dog タグ側で変えても良いのだが、  
制作者が別の場合あとから修正する必要が生まれたりと都合が悪い。

影響を与えないことを明示的にしておきたいので、  
ここは素直に CSS の子セレクタを使おう。  
ただし、Dog タグも `.cat > h1` という構造を持っているので  
これでも影響が出てしまう。
`:scope > .cat > h1` とすることで Cat タグの h1 にのみカラー変更が反映された。

<h6 class="hl-filename">cat.tag</h6>
```js
<Cat>
  <style>
    :scope {
      display: block;
    }
    .cat:before {
      content: "🐈";
    }
    :scope > .cat > h1 {
      font-size: 20px;
      color: #ee0000;
    }
  </style>
  <div class="cat">
    <h1>h1 text</h1>
    <yield />
  </div>
</Cat>
```

![う”う”う”う”おぉぉぉ](http://devhage.s3.amazonaws.com/images/nest.png)

これをどう受け止めるかは読んでいる貴方次第だとは思うが、  
もし会話できる状況なのであれば Dog タグの製作者に  
一番親になっている div には  
dog なのに cat はおかしいので、  
クラス名を変更したら良いのではないかという提案した方がいいだろう。

ただ、技術レベルの格差も含めどんな誰がどういった状況で使うかは分からないが、  
広く使われる場合は防護策として使う場合もあるだろう。

通常の CSS コーディングであれば、3階層にわたる子セレクタ指定をされるとイラッとくるが  
Scoped だと言っている以上は単に強くしたいのか他に書き方を知らないのか曖昧な状態とは違い、
明示的な「上書きするべきではない」という意思表示にもなる。

どうしても変えたい場合は仕様変更であるため要相談、という意志だ。

とりあえずここまでのサンプルは以下にあげておいた。  

> [glassesfactory/think-riot-scoped-css](https://github.com/glassesfactory/think-riot-scoped-css/tree/master/seikimatsu)

## 何でもかんでも詰め込むべきではない

便利な Scoped CSS ではあるが、  
当たり前ではあるが何でもかんでも詰め込むべきではないだろう。  
安易に Scoped 化しても先程のように影響を受けてしまうこともある。

ある程度の規模のものを作るのなら、  
絶対に崩れてはならない部分をスコープ化し、  
共通した要素は今まで通り、別の CSS で定義するのが良いと思われる。  
更に、近年では media query の登場により CSS の設計が複雑化しがちな傾向にある。

分離できることは適切に分離して見通しをよくすることが望ましい。

例えば、レイアウトと部品であること、状態変化は容易に分離できるだろう。

長くなったので前後編と分けることにした。  
後編では実際に仮想の UI を作りながら、より実践的な設計を考えてみたい。
