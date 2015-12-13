var aws = require('aws-sdk');
var s3 = new aws.S3({ apiVersion: '2006-03-01' });



var PREFIX = "ぎっとはぶのraw url";

exports.handler = function(event, context) {
    var modified = event.head_commit.modified;
    var added = event.head_commit.added;
    var tmpTask = modified.concat(added);
    var tmpTaskNum = tmpTask.length;
    var tmpTaskCnt = 0;

    for( var i = 0; i < tmpTask.length; i++){
      var task = tmpTask[i];
      var data = {
        src: PREFIX + task
      };
      var lambda = new aws.Lambda({apiVersion: '2014-11-11'});
      var params = {
        FunctionName: "Markdownコンパイルするラムダスクリプト",
        InvokeArgs: JSON.stringify(data, null, ' ')
        };
      lambda.invokeAsync(params, function(err, data){
        tmpTaskCnt++;
        if(err){
          console.log(err);
        }
        if(tmpTaskCnt == tmpTaskNum){
          context.done();
        }
      });
      // , function(err, data){
      //   if(err) context.done('error', err.stack);
      //   else context.done(null, '');
    }
};
