# フロントの開発環境を docker-compose で丸め込んだ話

長期でフロントを運用、開発し続けている案件の開発環境を  
docker 単品でゴニョゴニョしていた環境から docker-compose で丸め込んだものに変更したので    
偉そうなことを書いてみる。

## meta

- slug: front_docker_compose
- date: 2017-06-14 10:00 
- tags: front, docker
- active: true

## content

## 今までの開発環境

まず、今までの開発環境について。

* git でファイル管理
* node でタスクランナー(gulp)を走らせて js や css 等をビルド
* js は babel, css は stylus, HTML は pug で記述
* docker 内の nginx でリバースプロキシを行い本番等から動的なデータを参照。
* ビルドされたファイルは docker コンテナと共有してローカルでビルドしたものを docker コンテナが参照して nginx で表示
* nginx の conf はイメージに含めていた。

ディレクトリ構成は以下。

```shell
/work
├/dist
├/gulp
├/src
│ ├/js
│ ├/stylus
│ ├/pug
│ └/media
└/test
```


docker コンテナへは work ディレクトリを共有していた。

配布された開発環境をセットアップするには後述の手順を踏む必要があった。

* git clone でリポジトリからソースコードを落としてくる
* docker, node のインストール
* package.json を元に node_modules のインストール
* C 系のモジュールなど node が依存しているモジュールがある場合は別途 homebrew 等でインストール(npm install やりなおし)
* 指定されたコマンドを元に docker コンテナの作成、実行
* リバースプロキシの追加変更等、各自で nginx の conf をいじりたい場合は docker コンテナ内にattach後、エディタをインストールし直接編集する
* js 等ソースコードのビルド

一人でやる分には問題が無いわけではないが、  
本格的に開発者の数を増やそうとするといくつか問題が出てくる。

* 各自の環境に既にインストール済みのモジュールなどが影響し、npm install 等が失敗することがある(昔に比べると随分減ったが)
* docker コンテナ内にある nginx の conf を編集した際の差分管理、共有
* そもそも docker コンテナでポートフォワーディングやディレクトリ共有をしだした時、アブラマシマシメンカタメよろしく呪文のように長いコマンドを叩く必要がある

これらを改善するために docker-compose で開発環境を丸め込むことにした。

## docker-compose について

docker-compose 自体は docker をインストールした時点で付属してくる。
homebrew などの CUI だけでなく、今はインストーラーが配布されているので  
docker 及び docker-compose の導入についてはこの記事では割愛する。

docker がそもそも何なのかなどは、  
[自分がいじり始めた時に書いた記事](https://dev.hageee.net/43) から既に3年が経過している。
boot2docker がなくなって docker-machine になっているなど状況はいくつか変わっている。

幸いにも、当時よりも新しくて丁寧にフロントエンドで docker を活用する記事が幾つか世の中に放たれているようので改めておググりになられたほうが良いだろう。

docker-compose は複数の docker コンテナを連携させるための仕組みだ。

今まで docker にもその仕組自体はあったが、  
一つ一つ立ち上げたり立ち上げる順番を手動で管理したりする必要があった。  
そのため、複数のコンテナを元にした一つのサービスを立ち上げる際に非常に冗長な手続きとなっていた。

docker-compose は連携したいコンテナを yaml で記述して管理する。  
コンテナ群を立ち上げたい時は、一度のコマンドで依存関係も docker-compose 側で管理しながら yaml を元に全てのコンテナを立ち上げてくれる。

どのような yaml をかけばいいか等、詳しいことは以下の記事を参考にして欲しい。

> [docker-composeを使うと複数コンテナの管理が便利に](http://qiita.com/y_hokkey/items/d51e69c6ff4015e85fce)

## フロントエンドで docker-compose を活用するパターン

先に挙げた記事にあるように、yaml と Dockerfile を用意する必要がある。  
docker 周りに絞ったファイル構成は以下。

```shell
/work
├/docker-compose.yaml
├/front (nginx)
│ ├/Dockerfile
│ └/default.conf (nginx の conf)
└/build-dockerfile (ビルドするための node コンテナ)
```


node 用のコンテナのための Dockerfile が、  
慣習を無視した名前と構成で作っているのは後述するファイル共有のため。

docker-compose.yaml は以下のように記述している。

```yaml
version: "2.0"
services:
  my-front:
    build: ./front
    container_name: my-front
    command: /bin/bash -c "nginx -g 'daemon off;'"
    ports:
      - "80:80"
    links:
      - my-build
    volumes:
      - /work/案件名/work/dist:/var/www/work

    tty: false
    stdin_open: false

  my-build:
    build:
      context: .
      dockerfile: build-dockerfile
    container_name: my-build
    volumes:
      - /work/案件名/work/dist:/var/www/work/dist
      - /work/案件名/work/src:/var/www/work/src
      - /work/案件名/work/.git:/var/www/work/.git
    command: /bin/bash
    tty: true
    stdin_open: true
```

yaml の volumes が `docker run` で渡す `-v` オプション、  
`ports` が `-p` オプションに該当する。

長いコマンドを入れるより、yaml に書けるだけでも随分楽になるはずだ。

nginx 用の Dockerfile は以下。

```Dockerfile
FROM nginx:latest

#setup requirements packages.
RUN set -x \
  && apt-get update -y

#adding config files
ADD default.conf /etc/nginx/conf.d

RUN mkdir /var/www && mkdir /var/www/work
```

front ディレクトリ内の default.conf をイメージ生成時にコピーして含ませている。

node 用の Dockerfile は以下。

```Dockerfile
FROM node:latest

#setup requirements packages.
RUN set -x \
  && apt-get update -y

#setup node global modules
RUN npm i -g gulp webpack \
    && mkdir /var/www/ \
    && mkdir /var/www/work


ADD package.json /var/www/work/package.json
ADD .babelrc /var/www/work/.babelrc
ADD gulp /var/www/work/gulp
ADD gulpfile.js /var/www/work/gulpfile.js

WORKDIR /var/www/work

RUN npm install
```

こちらもビルドに直接必要なファイルはイメージ内にコピーしている。

本来であれば node 用の Dockerfile もディレクトリを作り、  
その中に配置するのが正しいのだが  
イメージを作る際にファイルをコピーしたい場合、  
Dockerfile があるディレクトリより上に遡って参照できないという謎の制約がある。


```yaml
build:
    context: .
    dockerfile: build-dockerfile
```

ただ、`dockerfile` オプションで使いたい Dockerfile を指定できるため  
あまり綺麗ではないがコピーしたいファイルと同じディレクトリに Dockerfile を配置し、  
ビルドにつかう　Dockerfile を yaml で指定してやることでこの問題は一応解決した。


docker-compose で固めることで、開発を始めるまでのステップは以下のように変化した。

* git clone
* docker-compsoe up --build
* docker attach ビルド用コンテナ
* gulp build

最悪、この程度のコマンドと手順であれば、それを叩くだけの GUI を作ることはそう難しくないはずだ。

ついでに nginx の conf も静的に配置しているので、編集してもきちんと履歴がとれるようになった。

とりあえずメモがてら書きなぐった。

きっとまた後数年したら図版を交えて  
よりわかりやすく解説してくれる記事が出てくるはず。  
いまいち分かりづらかった人はそれを待つか、僕にお酒をおごってくれるかすれば直接話しをしに行くのもやぶさかではないのでよろしくお願いします。

