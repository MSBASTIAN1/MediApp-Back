"use strict";

const { v4: uuidv4 } = require("uuid");
const AWS = require("aws-sdk");
// AWS.config.update({ region: process.env.REGION });
const dynamodb = new AWS.DynamoDB.DocumentClient({
  region: process.env.REGION,
});

const s3 = new AWS.S3();

// Insert
module.exports.insert = async (event) => {
  console.log("insert", event);

  // Check if event.body is defined and not null
  if (!event.body) {
    return {
      statusCode: 400,
      headers: {
        "Access-Control-Allow-Origin": "*", // Allow access from any origin
        "Access-Control-Allow-Credentials": true, // Allow credentials in requests
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

  // Check if body contains the expected data
  if (
    !body.description ||
    !body.user_id ||
    !body.medicament_id ||
    !body.date ||
    !body.time ||
    !body.frequency ||
    !body.quantity ||
    !body.status
  ) {
    return {
      statusCode: 400,
      headers: {
        "Access-Control-Allow-Origin": "*", // Allow access from any origin
        "Access-Control-Allow-Credentials": true, // Allow credentials in requests
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

  const reminder = {
    id: id,
    description: body.description,
    user_id: body.user_id,
    medicament_id: body.medicament_id,
    date: body.date,
    time: body.time,
    frequency: body.frequency,
    quantity: body.quantity,
    status: body.status,
  };

  const params = {
    TableName: process.env.REMINDERS_TABLE,
    Item: reminder,
  };

  try {
    await dynamodb.put(params).promise();
    return {
      statusCode: 200,
      headers: {
        "Access-Control-Allow-Origin": "*", // Allow access from any origin
        "Access-Control-Allow-Credentials": true, // Allow credentials in requests
      },
      body: JSON.stringify(
        {
          message: "Inserted Successfully",
          data: reminder,
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

// Select by user_id
module.exports.selectByUserId = async (event) => {
  console.log("selectByUserId", event);

  // Obtener el user_id desde los parámetros de la consulta
  const userId = event.queryStringParameters && event.queryStringParameters.user_id;

  if (!userId) {
    return {
      statusCode: 400,
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Credentials": true,
      },
      body: JSON.stringify(
        {
          message: "Error: user_id is required as a query parameter.",
        },
        null,
        2
      ),
    };
  }

  // Definir los parámetros para la consulta en DynamoDB
  const params = {
    TableName: process.env.REMINDERS_TABLE,
    IndexName: "UserIdIndex", // índice secundario global en la tabla para user_id
    KeyConditionExpression: "user_id = :user_id",
    ExpressionAttributeValues: {
      ":user_id": userId,
    },
  };

  try {
    // Ejecutar la consulta y esperar a que se complete
    const result = await dynamodb.query(params).promise();
    return {
      statusCode: 200,
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Credentials": true,
      },
      body: JSON.stringify(
        {
          message: "Data selected by user_id",
          result: result.Items, // result.Items contiene los datos consultados
        },
        null,
        2
      ),
    };
  } catch (error) {
    console.error("Error selecting data by user_id", error);
    return {
      statusCode: 500,
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Credentials": true,
      },
      body: JSON.stringify(
        {
          message: "Error selecting data by user_id",
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

  // Define the parameters for the DynamoDB scan operation
  const params = {
    TableName: process.env.REMINDERS_TABLE,
  };

  try {
    // Execute the scan operation and wait for it to complete
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
          result: result.Items, // result.Items contains the scanned data
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

  // Parse the request body to get the data provided by the client
  const body = JSON.parse(event.body);

  // Define the parameters for the DynamoDB update operation
  const params = {
    TableName: process.env.REMINDERS_TABLE, // Specify the table where the update will occur
    Key: {
      id: body.id, // Specify the primary key of the item to be updated
    },
    // Update expression to modify the item's attributes
    UpdateExpression:
      "SET description = :description, user_id = :user_id, medicament_id = :medicament_id, #date = :date, #time = :time, frequency = :frequency, quantity = :quantity, #status = :status",
    // Values for the attributes to be set
    ExpressionAttributeValues: {
      ":description": body.description,
      ":user_id": body.user_id,
      ":medicament_id": body.medicament_id,
      ":date": body.date,
      ":time": body.time,
      ":frequency": body.frequency,
      ":quantity": body.quantity,
      ":status": body.status,
    },
    ExpressionAttributeNames: {
      "#date": "date",
      "#time": "time",
      "#status": "status",
    },
    // Condition to ensure the item exists
    ConditionExpression: "attribute_exists(id)",
  };

  try {
    // Execute the update operation and wait for it to complete
    await dynamodb.update(params).promise();
    // Create the updated reminder object to display it later
    const updatedReminder = {
      id: body.id,
      description: body.description,
      user_id: body.user_id,
      medicament_id: body.medicament_id,
      date: body.date,
      time: body.time,
      frequency: body.frequency,
      quantity: body.quantity,
      status: body.status,
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
          data: updatedReminder,
        },
        null,
        2
      ),
    };
  } catch (error) {
    // If the condition fails (if the item does not exist), DynamoDB will throw an error
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
  
  // Obtener el id desde los parámetros del path
  const { id } = event.pathParameters;

  // Definir los parámetros para obtener el ítem antes de eliminarlo
  const getParams = {
    TableName: process.env.REMINDERS_TABLE,
    Key: {
      id: id,
    },
  };

  // Definir los parámetros para la operación de eliminación en DynamoDB
  const deleteParams = {
    TableName: process.env.REMINDERS_TABLE,
    Key: {
      id: id,
    },
    ConditionExpression: "attribute_exists(id)",
  };

  try {
    // Obtener el ítem antes de eliminarlo
    const result = await dynamodb.get(getParams).promise();
    const reminderToDelete = result.Item;

    // Verificar si el ítem existe
    if (!reminderToDelete) {
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

    // Ejecutar la operación de eliminación
    await dynamodb.delete(deleteParams).promise();

    // Retornar una respuesta con los datos del ítem eliminado
    return {
      statusCode: 200,
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Credentials": true,
      },
      body: JSON.stringify(
        {
          message: "Deleted",
          data: reminderToDelete,
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
