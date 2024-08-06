"use strict";

const { v4: uuidv4 } = require("uuid");
const AWS = require("aws-sdk");
// AWS.config.update({ region: process.env.REGION });
const dynamodb = new AWS.DynamoDB.DocumentClient({
  region: process.env.REGION,
});

const s3 = new AWS.S3();

// Function for upload image to S3
const uploadImageToS3 = async (file, fileName, fileType) => {
  const params = {
    Bucket: process.env.AWS_S3_BUCKET_NAME,
    Key: `images/${Date.now()}_${fileName}`,
    Body: Buffer.from(file, "base64"),
    ContentType: fileType,
  };

  try {
    const uploadResult = await s3.upload(params).promise();
    return uploadResult.Location;
  } catch (error) {
    console.error("Error uploading file:", error);
    throw error;
  }
};

// Endpoint for upload image
module.exports.uploadImage = async (event) => {
  const { file, fileName, fileType } = JSON.parse(event.body);

  try {
    const url = await uploadImageToS3(file, fileName, fileType);
    return {
      statusCode: 200,
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Credentials": true,
      },
      body: JSON.stringify({ url }),
    };
  } catch (error) {
    return {
      statusCode: 500,
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Credentials": true,
      },
      body: JSON.stringify({
        error: "Error uploading file",
        details: error.message,
      }),
    };
  }
};

// Insert multiple medicaments
module.exports.insertMultiple = async (event) => {
  console.log("insertMultipleMedicaments", event);

  if (!event.body) {
    return {
      statusCode: 400,
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Credentials": true,
      },
      body: JSON.stringify(
        { message: "Error: The request body is empty." },
        null,
        2
      ),
    };
  }

  const body = JSON.parse(event.body);

  if (!Array.isArray(body.medicaments) || body.medicaments.length === 0) {
    return {
      statusCode: 400,
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Credentials": true,
      },
      body: JSON.stringify(
        {
          message: "Error: The request body must contain an array of products.",
        },
        null,
        2
      ),
    };
  }

  const medicaments = body.medicaments.map((medicament) => {
    if (
      !medicament.title ||
      !medicament.description ||
      !medicament.first_effects ||
      !medicament.side_effects ||
      !medicament.recommended_dose ||
      !medicament.image
    ) {
      throw new Error(
        "Error: One or more products do not contain the expected data."
      );
    }

    return {
      PutRequest: {
        Item: {
          id: uuidv4(),
          name: medicament.title,
          description: medicament.description,
          category_id: medicament.first_effects,
          price: medicament.side_effects,
          stock: medicament.recommended_dose,
          image: medicament.image,
        },
      },
    };
  });

  const params = {
    RequestItems: {
      [process.env.MEDICAMENTS_TABLE]: medicaments,
    },
  };

  try {
    await dynamodb.batchWrite(params).promise();
    return {
      statusCode: 200,
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Credentials": true,
      },
      body: JSON.stringify(
        { message: "Inserted Successfully", data: body.medicaments },
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
        { message: "Error inserting data", error: error.message },
        null,
        2
      ),
    };
  }
};

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
    !body.title ||
    !body.description ||
    !body.first_effects ||
    !body.side_effects ||
    !body.image ||
    !body.recommended_dose
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

  const medicaments = {
    id: id,
    title: body.title,
    description: body.description,
    first_effects: body.first_effects,
    side_effects: body.side_effects,
    image: body.image,
    recommended_dose: body.recommended_dose,
  };

  const params = {
    TableName: process.env.MEDICAMENTS_TABLE,
    Item: medicaments,
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
          data: medicaments,
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

  // Define the parameters for the DynamoDB scan operation
  const params = {
    TableName: process.env.MEDICAMENTS_TABLE,
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
    TableName: process.env.MEDICAMENTS_TABLE, // Specify the table where the update will occur
    Key: {
      id: body.id, // Specify the primary key of the item to be updated
    },
    // Update expression to modify the item's attributes
    UpdateExpression:
      "SET title = :title, description = :description, first_effects = :first_effects, side_effects = :side_effects, image = :image, recommended_dose = :recommended_dose",
    // Values for the attributes to be set
    ExpressionAttributeValues: {
      ":title": body.title,
      ":description": body.description,
      ":first_effects": body.first_effects,
      ":side_effects": body.side_effects,
      ":image": body.image,
      ":recommended_dose": body.recommended_dose,
    },
    // Condition to ensure the item exists
    ConditionExpression: "attribute_exists(id)",
  };

  try {
    // Execute the update operation and wait for it to complete
    await dynamodb.update(params).promise();
    // Create the updated user object to display it later
    const updatedMedicament = {
      id: body.id,
      title: body.title,
      description: body.description,
      first_effects: body.first_effects,
      side_effects: body.side_effects,
      image: body.image,
      recommended_dose: body.recommended_dose,
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
          data: updatedMedicament,
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
  // Parse the request body to get the data provided by the client
  const body = JSON.parse(event.body);

  // Define the parameters to get the item before deleting it
  const getParams = {
    TableName: process.env.MEDICAMENTS_TABLE,
    Key: {
      id: body.id,
    },
  };

  // Define the parameters for the DynamoDB delete operation
  const deleteParams = {
    TableName: process.env.MEDICAMENTS_TABLE,
    Key: {
      id: body.id,
    },
    ConditionExpression: "attribute_exists(id)",
  };

  try {
    // Get the item before deleting it
    const result = await dynamodb.get(getParams).promise();
    const medicamentToDelete = result.Item;
    // Check if the item exists
    if (!medicamentToDelete) {
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

    // Execute the delete operation and wait for it to complete
    await dynamodb.delete(deleteParams).promise();
    // Return a response with the deleted item's data
    return {
      statusCode: 200,
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Credentials": true,
      },
      body: JSON.stringify(
        {
          message: "Deleted",
          data: medicamentToDelete,
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
