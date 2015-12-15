var doc = require('dynamodb-doc');
var dynamo = new doc.DynamoDB();

exports.handler = function(event, context) {
    var param = {
      TableName: "かうんとてーぶる"
    //   KeyConditionExpression: "table_name = :table_name AND activity = :activity",
    //   ExpressionAttributeValues: {":table_name": "entries", ":activity": "true"}
    };

    dynamo.scan(param, function(err, data){
      // カウント取れなかったら実行中止
      if(err){
        console.log("えらー", err);
        context.done();
        return;
      }
      count = data.Items[0].count;
      console.log("count:", count);
      param = {
          TableName: "えんとりーてーぶる",
          ScanIndexForward: false,
          KeyConditionExpression: "active = :activity",
          ExpressionAttributeValues: {":activity": "true"}
      };

      if(event.id === '' || event.id == "1"){
        param.Limit = "5";
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

          var response = {
            count: count,
            data: data.Items,
            hasNext: (data.LastEvaluatedKey) ? true : false
          };
          context.succeed(response);
        });
      } else {
        breforeID = parseInt(event.id) - 1;

        var limit = breforeID * 5;
        param.Limit = String(limit);

        dynamo.query(param, function(err, data){
          console.log("first query result", err, data);
          if(err){
            console.log(err);
            context.done();
          }
          if(!data.hasOwnProperty("LastEvaluatedKey")){
            console.log("no page");
            context.done();
            return
          }
          var lastKey = data.LastEvaluatedKey;
          param.ExclusiveStartKey = lastKey;

          param.Limit = "5";
          dynamo.query(param, function(err, data){
            if(err){
              console.log(err);
              context.done();
            }
            if(!data){
              console.log("data not found");
              context.done();
              return
            }
            console.log("result:",data.Items);
            var response = {
              count: count,
              data: data.Items,
              hasNext: (data.LastEvaluatedKey) ? true : false
            };
            context.succeed(response);
          });

        });
      }
    });

};
