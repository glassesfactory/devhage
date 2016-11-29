でぶはげ!

Application less blog scripts.

## requirements

* AWS Lambda
* AWS API Gateway
* AWS DynamoDB
* node > v4.x
* babel
* config.json
* 何かに負けない心


## optional

#### 記事jsonの保存先

* AWS S3
* nginx + lua

## usage

```shell
$ npm install
$ npm run build
```

## Config.json

リポジトリ直下に `config.json` を作ってください。

```json
{
  "Bucket": "{{バケット名}}",
  "access_key": "{{アクセスキー}}",
  "secret_key": "{{シークレットキー}}",
  "region": "{{リージョン}}",
  "json_dir": "{{s3使うなら json の設置箇所}}",
  "api_prefix": "{{API Gateway から発行されるURL}}",
  "limit": {{標準のリミット<int>}}
}
```

## Markdonw syntax rule

API BluePrint もどきを採用してます。

文頭の h1(タイトル扱い), `## meta`, `## content` は予約語になっています。


```Markdonw
# タイトル

ですくりぷしょん

## meta

- slug: 記事のurl
- date: 2015-12-13 10:00
- tags: blog,js
- active: true

## content

なかみ

```

上記の Markdown をでぶはげがコンパイルすると以下の様な json が出力されます。

`記事のurl.json`

```json
{
  "title": "タイトル",
  "description": "ですくりぷしょん",
  "slug": "記事のurl",
  "date": 1449968400000,
  "tags": [blog,js],
  "active": true,
  "content": "なかみ"
}
```

### タイトルとデスクリプションの関連性

h1 以下はすべてデスクリプションとなります。  
タイトル内に改行を入れたい場合は改行コードでも入れればいいんじゃないでしょうか。

デスクリプション内では通常のMarkdownシンタックスが使えます。

### meta 内の記述

`slug`, `date`, `active` は必須です。

`slug` は記事の url, `date` は DynamoDB でのソートキー、 `active` は主キー(true のものを API Gateway で拾う) となります。

meta 内では `- key: value` のシンタックスで記述したものが  
そのまま json の `{"key": "value"}`` として出力されるため、  
他に json に key value セットを出力したい場合は使ってください。
