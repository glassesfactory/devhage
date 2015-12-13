var protagonist = require('protagonist');
var md = require('node-markdown').Markdown;
var request = require('request');
var jsdom = require('jsdom');

var aws = require('aws-sdk');
var s3 = new aws.S3({apiVersion: '2006-03-01'});

var currentCtx = null;

// Markdownコンパイルするマン
exports.handler = function(event, context) {
  currentCtx = context;
  var src = event.src;
  console.log(event);
  console.log(src);
  request.get(src).on('response', function(mdRes){
    var line = '';
    mdRes.setEncoding('utf8');
    mdRes.on('data', function(l){
      line += l;
    });

    mdRes.on('end', function(){
      protagonist.parse(line, {type: "ast"}, function(err, result){
        if(err){
          console.log(err);
          context.done();
        }
        var json = _createContent(result);
        console.log(json);
        if(!json.slug){
          // throw Err
          console.log("no slug");
          context.done();
          return;
        }
        // TODO: ファイルの保存はキューイングに入れたい
        var fileName = json.slug + ".json";
        // s3 に保存するならこれ
        s3.putObject({
          Bucket: "ばけっと",
          Key: "data/" + fileName,
          Body: JSON.stringify(json),
          ContentType: "application/json"
        }, function(err, res){
          if(err){
            console.log(err);
          }
          context.done();
        });
      });
    });
  });
}



function escape(html){
  return String(html)
    .replace(/&(?!\w+;)/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function toBR(html){
  return String(html)
  .replace(/\n\n/g, '\n')
  .replace(/\n/g, '<br />');
}



// コンテント作る
function _createContent(data){
  var result = {};
  result.title = data.ast.name;
  var desc = data.ast.description.split(/##\s*meta/);

  var description = desc[0];
  var meta = desc[1].split(/##\s*content/)[0];
  var content = desc[1].split(/##\s*content/)[1];

  meta = metaParser(meta);
  if(!meta.tags instanceof Array){
    meta.tags = [meta.tags];
  }
  result.content = escape(md(content));
  result.description = escape(md(description));
  result.date = new Date(meta.date).getTime();
  result.created_at = new Date().getTime();
  merge(result, meta);
  return result;
}


// meta 系のパース
function metaParser(meta){
  var obj = {};
  var window = jsdom.jsdom('<div>' + md(meta) + '</div>').parentWindow;
  var div = window.document.body.children[0];
  if(div.children[0].children.length < 1){
    return null
  }
  var children = div.children[0].children;
  obj = parseDom(children);
  return obj;
}

// dom のパース
function parseDom(children){
  var obj = {};
  for(var i = 0; i < children.length; i++){
    var item = children[i];
    if(item.children.length > 1){
      if(item.children[1].tagName.toLowerCase() == "ul"){
        var k = item.children[0].textContent;
        var ul = item.children[1];
        obj[k] = parseDom(ul.children);
      }
    } else {
      var kv = getKV(item);
      if(!kv){
        continue;
      }
      obj[kv[0]] = kv[1];
    }
  }
  return obj;
}

// kv から
function getKV(item){
  var kv = item.textContent.split(/\:\s*/g);
  // 日時兼時間が含まれていた
  if(kv[0] == "date" && kv.length > 2){
    kv[1] = kv[1] + ":" + kv[2]
  }

  var v = kv[1];
  if(!v){
    return null
  }
  if(v.indexOf(',') > -1){
    v = v.split(',');
    kv[1] = v;
  }

  return kv;
}

// オブジェクトをマージする
 function merge(obj1, obj2) {
    if (!obj2) {
        obj2 = {};
    }
    for (var attrname in obj2) {
        if (obj2.hasOwnProperty(attrname) && !obj1.hasOwnProperty(attrname)) {
            obj1[attrname] = obj2[attrname];
        }
    }
}
