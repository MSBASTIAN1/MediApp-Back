"use strict";

const { v4: uuidv4 } = require("uuid");
const AWS = require("aws-sdk");
const dynamodb = new AWS.DynamoDB.DocumentClient({
  region: process.env.REGION,
});

// Insert
module.exports.insert = async (event) => {
  console.log("insert", event);

  if (!event.body) {
    return {
      statusCode: 400,
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Credentials": true,
      },
      body: JSON.stringify(
        {
          message: "Error: The request body is empty.",
        },
        null,
        2
      ),
    };
  }

  const id = uuidv4();
  const body = JSON.parse(event.body);

  if (!body.description || !body.user_id || !body.email) {
    return {
      statusCode: 400,
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Credentials": true,
      },
      body: JSON.stringify(
        {
          message:
            "Error: The request body does not contain the expected data.",
        },
        null,
        2
      ),
    };
  }

  const recommendation = {
    id: id,
    description: body.description,
    user_id: body.user_id,
    email: body.email,
  };

  const params = {
    TableName: process.env.RECOMMENDATIONS_TABLE,
    Item: recommendation,
  };

  try {
    await dynamodb.put(params).promise();
    return {
      statusCode: 200,
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Credentials": true,
      },
      body: JSON.stringify(
        {
          message: "Inserted Successfully",
          data: recommendation,
        },
        null,
        2
      ),
    };
  } catch (error) {
    console.error("Error inserting data", error);
    return {
      statusCode: 500,
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Credentials": true,
      },
      body: JSON.stringify(
        {
          message: "Error inserting data",
          error: error.message,
        },
        null,
        2
      ),
    };
  }
};

// Select
module.exports.select = async (event) => {
  console.log("select", event);

  const params = {
    TableName: process.env.RECOMMENDATIONS_TABLE,
  };

  try {
    const result = await dynamodb.scan(params).promise();
    return {
      statusCode: 200,
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Credentials": true,
      },
      body: JSON.stringify(
        {
          message: "Data selected",
          result: result.Items,
        },
        null,
        2
      ),
    };
  } catch (error) {
    console.error("Error selecting data", error);
    return {
      statusCode: 500,
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Credentials": true,
      },
      body: JSON.stringify(
        {
          message: "Error selecting data",
          error: error.message,
        },
        null,
        2
      ),
    };
  }
};

// Update
module.exports.update = async (event) => {
  console.log("update", event);

  const body = JSON.parse(event.body);

  const params = {
    TableName: process.env.RECOMMENDATIONS_TABLE,
    Key: {
      id: body.id,
    },
    UpdateExpression:
      "SET description = :description, user_id = :user_id, email = :email",
    ExpressionAttributeValues: {
      ":description": body.description,
      ":user_id": body.user_id,
      ":email": body.email,
    },
    ConditionExpression: "attribute_exists(id)",
  };

  try {
    await dynamodb.update(params).promise();
    const updatedRecommendation = {
      id: body.id,
      description: body.description,
      user_id: body.user_id,
      email: body.email,
    };

    return {
      statusCode: 200,
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Credentials": true,
      },
      body: JSON.stringify(
        {
          message: "Updated",
          data: updatedRecommendation,
        },
        null,
        2
      ),
    };
  } catch (error) {
    if (error.code === "ConditionalCheckFailedException") {
      return {
        statusCode: 400,
        headers: {
          "Access-Control-Allow-Origin": "*",
          "Access-Control-Allow-Credentials": true,
        },
        body: JSON.stringify(
          {
            message: "The item with the provided id does not exist.",
          },
          null,
          2
        ),
      };
    }
    console.error("Error updating data", error);
    return {
      statusCode: 500,
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Credentials": true,
      },
      body: JSON.stringify(
        {
          message: "Error updating data",
          error: error.message,
        },
        null,
        2
      ),
    };
  }
};

// Delete
module.exports.delete = async (event) => {
  console.log("delete", event);

  const body = JSON.parse(event.body);

  const getParams = {
    TableName: process.env.RECOMMENDATIONS_TABLE,
    Key: {
      id: body.id,
    },
  };

  const deleteParams = {
    TableName: process.env.RECOMMENDATIONS_TABLE,
    Key: {
      id: body.id,
    },
    ConditionExpression: "attribute_exists(id)",
  };

  try {
    const result = await dynamodb.get(getParams).promise();
    const recommendationToDelete = result.Item;
    if (!recommendationToDelete) {
      return {
        statusCode: 400,
        headers: {
          "Access-Control-Allow-Origin": "*",
          "Access-Control-Allow-Credentials": true,
        },
        body: JSON.stringify(
          {
            message: "The item with the provided id does not exist.",
          },
          null,
          2
        ),
      };
    }

    await dynamodb.delete(deleteParams).promise();
    return {
      statusCode: 200,
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Credentials": true,
      },
      body: JSON.stringify(
        {
          message: "Deleted",
          data: recommendationToDelete,
        },
        null,
        2
      ),
    };
  } catch (error) {
    console.error("Error deleting data", error);
    return {
      statusCode: 500,
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Credentials": true,
      },
      body: JSON.stringify(
        {
          message: "Error deleting data",
          error: error.message,
        },
        null,
        2
      ),
    };
  }
};
