var aws = require('aws-sdk');
var s3 = new aws.S3({ apiVersion: '2006-03-01' });
var dynamodb = new aws.DynamoDB({region: 'ap-northeast-1'});

exports.handler = function(event, context) {
    var bucket = event.Records[0].s3.bucket.name;
    var key = decodeURIComponent(event.Records[0].s3.object.key.replace(/\+/g, ' '));
    var params = {
        Bucket: bucket,
        Key: key
    };
    s3.getObject(params, function(err, data) {
        if (err) {
            console.log(err);
            var message = "Error getting object " + key + " from bucket " + bucket +
                ". Make sure they exist and your bucket is in the same region as this function.";
            console.log(message);
            context.fail(message);
        } else {
            var entry = JSON.parse(data.Body.toString());
            putDB(entry, context, data.ContentType);

        }
    });
};

function putDB(entry, context, contentType){
  var tags = entry.tags.map(function(tag){
    return {"S": tag};
  });
  if(!tags){
    tags = [];
  }
  var param = {
    TableName: "えんとりーてーぶる",
    Item: {
      "slug":{"S": entry.slug},
      "date":{"N": String(entry.date)},
      "title": {"S": entry.title},
      "description": {"S": entry.description},
      "created_at": {"N": String(entry.created_at)},
      "content": {"S": entry.content},
      "tags": {"L": tags},
      "active": {"S":entry.active}
    }
  };

  dynamodb.putItem(param, function(err, data){
    if(err) { console.log("dynamo error", err); }
    else {
      console.log("data uploaded successfully," + data);
      var lambda = new aws.Lambda({apiVersion: '2014-11-11'});
      var lambdaParams = {
        FunctionName: "かうんとようてーぶる"
        };
      lambda.invokeAsync(lambdaParams, function(err, data){
        lambdaParams.FunctionName = "フィード作るラムダスクリプト";
        // クソだw
        lambda.invokeAsync(lambdaParams, function(err, data){
          context.succeed(contentType);
        });
      });
    }
  });
}
