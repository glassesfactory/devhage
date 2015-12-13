var doc = require('dynamodb-doc');
var dynamo = new doc.DynamoDB();

var count = 0;

exports.handler = function(event, context) {
    var param = {
        TableName: "えんとりーてーぶる",
        ScanIndexForward: true,
        KeyConditionExpression: "active = :activity",
        ExpressionAttributeValues: {":activity": "true"}
    }

    count = 0;
    dynamo.query(param, function(err, data){
      console.log(data.count);
    });
};
