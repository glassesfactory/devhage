var doc = require('dynamodb-doc');
var dynamo = new doc.DynamoDB();
var aws = require('aws-sdk');
var s3 = new aws.S3({ apiVersion: '2006-03-01' });
var rss = require('node-rss');
// rss フィード用
exports.handler = function(event, context) {
  var param = {
      TableName: "devhage-entry",
      ScanIndexForward: true,
      KeyConditionExpression: "active = :activity",
      ExpressionAttributeValues: {":activity": "true"}
  };

  param.Limit = "10";
  dynamo.query(param, function(err, data){
    if(err){
      console.log(err);
      context.done();
    }
    if(!data){
      console.log("data not found");
      context.done();
      return;
    }

    // 基本情報
    console.log(rss);
    var feed = rss.createNewFeed({{フィードの基本情報}});

    // エントリーぶっこむ
    var items = data.Items;
    for(var i = 0; i < items.length; i++){
      var entry = items[i];
      feed.addNewItem({{えんとりーのじょうほう}});
    }

    s3.putObject({
      Bucket: "ばけっとめい",
      Key: "feed/rss.xml",
      Body: rss.getFeedXML(feed),
      ContentType: "application/xml"
    }, function(err, res){
      if(err){
        console.log(err);
      }
      context.done();
    });
  });
};
