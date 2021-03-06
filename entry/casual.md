# ありものでサクッと作る今時っぽい気配だけ漂わせられるやつ

先日ちょっとしたきっかけでムラムラしたので日曜からの半日と月曜仕事中の確認待ちの空き時間や営業終了後の自由時間で釣り用ブログを作り直した。

技術者として真面目に考え始めると色々追求してしまってキリがなく、  
結局日本語を書くフェーズにいつまでたっても入れず  
出来上がる頃には今度はコンテンツとなるはずの釣りがオフシーズンに…  
とか俺あるあるなので、極力コードを書かないことをテーマに作った。

## meta

- slug: casual
- date: 2016-09-28 11:11
- tags: polymer, lua
- active: true


## content

## 使ったやつ

とりあえず選定した手段は以下。

管理画面: WordPress  
API: WP REST API  
フロント: Polymer  

## WordPress の用意

サーバー周りの開発環境として nginx と mariadb のイメージを用意する。  
用意すると言っても普段から仕事で使ってるので念のため pull するレベル。

適当に mariadb のコンテナを建てた後、ポートフォワード、ファイル共有、それと mariadb のコンテナとリンクするオプションを付けた nginx コンテナを立ち上げる。  
php 周りだけ追加で入れた上であとは nginx の config だけちょこっといじってとりあえず WordPress 開発する環境ができた。

WordPress が動いた時点でテーブル設計することとスクリプトと DB を繋ぐステップと、携帯からも含めて投稿できる管理画面作りが省略できた。

JSON フォーマットによる投稿データの取得も、プラグインを入れることで一行もスクリプトを書かずに達成できた。

カスタムフィールドもプラグインで API に反映させることができた。

ここまでググることしかしてないので載せられるソースコードが一行もない。
残念。

## フロント

続いて適当なディレクトリに入って、 polymer-cli で starter-kit  オプション付きでコマンドを叩いてフロント用のプロジェクトを作る。

この時点で Material デザインを取り込んだベーシックな UI 付きでリストページと詳細ページの雛形が生成される。  
あと pushState に対応した SPA としても動いたりする。

色味だったりは CSS variables で変数化されているのでそこをいじるだけである程度変わる。

ので、別にイケてるデザイナーとして売り出すようなブログでもないのでちょちょっと弄ってなんかそれっぽくする。  
Polymer には最初から UI フレームワーク的なものが入っているので、自分で bootstrap だとかをかき集める必要すらない。  

ソーシャルなアイコン類も、自分でいちいち公式だのイケてるのだのを探して取ってこなくても、svg データが埋め込まれたプラグインが提供されているのでサクッと bower で追加することですぐ使える。  
SVG なので色もプロパティから変えられるのでイラレや Sketch を開く必要すらない。

ものはついでなので、イマドキ(笑) 度を高めるためサーバーとの通信は fetch API を使う。
iOS とかは fetch-polyfill を入れれば動く。  

適当に HTML を書いて適当に JSON がレンダリングされるようにテンプレートタグに置き換えて終わり。

gulp タスクを組んで Babel とかも使おうかと思ったけど、今回そこまでスクリプトというか任意でコードを書く必要性がなかったのでそのまま動かした。

かっちり作るならまぁいくらでもやることあるんですが。

## OGP 周りと nginx の設定

手前味噌ではあるがSPA で、個別 URL へのリクエストはドキュメントルートの index.html を返してあとは JS でのルーティングに委ねるといったのはよくある手段の一つだと思っている。

例えば数字 ID が個別ページの URL であるならば、以下のような config が手っ取り早い。


    location ~ ^/\d+ {  
      try_files $uri /index.html;  
    }


とりあえず問答無用なやつ。

こうすることで、アクセスしてきたエンドユーザーに対しては意図したページを表示することができる。

ただ、これだけではどこかしらで OGP への対策が必要になるのは今更周知の事実と思っている。

今回フロントと API を分け、WordPress からはエンドユーザーに向けた HTML の配信はそれっぽくないという安易な理由からしたくなかったのでどうするか少し頭をひねった。

WordPress で作った API は別ドメインで提供することにしたのだが、今更作り直すのもしんどいので facebook からのアクセスのときは WordPress で HTML を出力して返すことにした。

API サーバーから HTML 返すとか、本来そんな構成になんかしないのはこっちだってわかってるので突貫省エネ(工数)仕様として目をつむってほしいのだが。

とにかく別ドメインから HTML を返さなければとかわけの分からない構成になった場合、当然シェアされるときの URL が意図したものにならない。

つまり、リダイレクトでは目的は達成出来ないのでリバースプロキシする必要がある。
ただ、nginx の config を自分で書いたことのある諸兄ならわかると思うが、  
正規表現を location ディレティブとして指定した場合リバースプロキシを使うことは出来ない。

そこで lua を併用して力技で取ってくることにした。  
UserAgent を見て、facebook の bot だった場合は sub request で無理やり WordPress から取ってくる。


    if ($http_user_agent ~* "facebookexternalhit") {  
      content_by_lua '   
      local tgt = ngx.var.id  
      res = ngx.location.capture("/prx", { args = {tgt = tgt }})  
      if res.body then  
        ngx.print(res.body)  
      else
        ngx.log(ngx.ERR, res.err)  
      end  
      ';  
      break;  
    }


まぁ一段キャッシュ挟んだほうがいいですが今回は省略。  
念のため言うとこのままコピペしても動かないので。  
Redis の lua モジュールとかもあったりするので、もし似たような概念のことを仕事でする場合は噛ますといいと思います。

この lua の ngx.location.capture が internal なディレクティブへの sub request を発行するのだが、  
そのなかでは proxy_pass を使うことができるので実質外部サーバーへの通信用として扱うことができる。  
パラメーターも渡すことができるのであとはチョチョイのチョイである。

最後だけガチでコード書いてるじゃんとかいうツッコミはやめてください。  
勢いだけでろくな設計もせずに作り始めたツケを何処かで支払う必要があっただけです。

## おわり

もうあとはここまできたら実際のサーバーを建ててデプロイするだけである。  
AWS で適当に EC2 インスタンス建てて Route53 でサブドメきったら一旦適当な html あげて  letsencrypt で SSL 証明書だけ取得して HTTP/2 で配信しておしまいです。  
HTTP/2 がいい感じに速く動くせいで、小規模案件の小手先のチューニング程度だと工数的な考えで見つめてみるとたんなるおっさんのこだわりにしか映らないレベルになったりするのでちょっとおっさんはへこみます。  
夜中人が見てない時間に作業して次の日11時ぐらいにコミットするレベルです。

こうして、ここまで作ったものをそれっぽく書き並べると  
「 Polymer で ServiceWorker とか使いながら JSON API なサイトを HTTP/2 で配信してる」
とか書けちゃったりするのでなんていうかちょろい人ならだませ(ry 目を輝かせてくれそうな感じしますね。

ま、とりあえず目的は達成したのでまた気が向いたときにチューニングしたり足りない物足したりしようと思います。  
何はともあれ中身を充実させるために釣りに行きます。
