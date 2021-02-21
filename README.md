# Cloud Developer Capstone Project

This project chooses option 2 _serverless_ according to the
[project rubric](https://review.udacity.com/#!/rubrics/2578/view).

It builds on top of my solution to the project for module 5 _Develop and Deploy Serverless Apps_, which is the backend
for an TODO application. According to [this discussion](https://knowledge.udacity.com/questions/152333)
reusing this project's code base is accepted for the capstone.

Compared to the TODO application, this project features:

- All used node modules updated to current versions.
- Data model changed and extended with more fields.
- Data model has constraints on the fields, e.g. min/max string size to protect this backend application from useless
  or malicious requests. A client like a UI is supposed to check these constraints before sending requests to this
  backend application.
- When the client asks for an upload URL for the attachment to an item, it not only receives an upload URL,
  but also the URL under which the attachment would be downloadable if it was uploaded.
  This eliminates the need for the client to again request all items for a user only to receive the attachment URL.
- However, the data model will only contain an attachment URL if an attachment was really uploaded.
  This is implemented by means of S3 notifying the backend via SNS that an object was uploaded.
  In this way a client asking the backend for an upload URL but then _not_ uploading an object would not lead anymore
  to the backend assuming an object was uploaded in S3.
- A client can delete the attachment without deleting the item.
- Deleting an item from DynamoDB deletes its attachments from S3 as well.

As the focus is on backend programming, I do not provide a frontend client, but rather a Postman collection, as
suggested in [this discussion](https://knowledge.udacity.com/questions/406740).

# Functionality of the application - Cooking Recipes Store

This application is the backend for storing (cooking) recipes. It will allow creating/removing/updating/fetching recipe
items. Each recipe item can optionally have one attachment, e.g. an image of an intermediate steps, or the recipe in
PDF format, or whatever makes sense for the client.
The attachment can only be created after the recipe item was created. The attachment can be deleted without the
recipe item being deleted.
Each user only has access to recipe items that s/he has created.

# Architecture

The application stores recipe items as JSON structure in DynamoDB and attachments as objects in S3.

## Data models

### Recipe item

Each recipe item stored in DynamoDB and returned to the client on recipe item creation requests contains
the following fields:

- `userId` (string) - id of the user owning this item
- `recipeId` (string) - a unique id for a recipe item
- `name` (string, min 1, max 100 chars) - name of a recipe item (e.g. "My famous soup")
- `recipe` (string, min 1, max 10000 chars) - recipe itself in a form that the user can enter easily, and the client can
  render nicely, e.g. MarkDown
- `attachmentUrl` (string, optional) - a URL pointing to an object attached to a recipe item.
  The object itself is stored in S3.

Example:

```json
{
  "userId": "google-oauth2|11345",
  "recipeId": "5c37344f-2af2-4876-b70b-546d0cf7f0a5",
  "name": "My famous soup",
  "recipe": "Ingredients: ...",
  "attachmentUrl": "https://some-bucket.s3.region.amazonaws.com/5c37344f-2af2-4876-b70b-546d0cf7f0a5"
}
```

### Recipe items

The list of recipe items returned by the request for all recipe items of a user is an
object containing a single property `recipes` being a list of recipe items.

Example:

```json
{
  "recipes": [
    {
      "userId": "google-oauth2|11345",
      "recipeId": "5c37344f-2af2-4876-b70b-546d0cf7f0a5",
      "name": "My famous soup",
      "recipe": "Ingredients: ...",
      "attachmentUrl": "https://some-bucket.s3.region.amazonaws.com/5c37344f-2af2-4876-b70b-546d0cf7f0a5"
    },
    {
      "userId": "google-oauth2|11345",
      "recipeId": "6325652a-026c-4e1c-b454-8b7bb0d5f48c",
      "name": "My famous desert",
      "recipe": "For this delicious desert you take ..."
    }
  ]
}
```

### Recipe item creation or update request

Each recipe item creation or update request contains the following fields:

- `name` (string, min 1, max 100 chars) - name of a recipe item (e.g. "My famous soup")
- `recipe` (string, min 1, max 10000 chars) - recipe itself in a form depending on the client. Suggested to use
  a form that the user can enter easily, and the client can render nicely, e.g. MarkDown.

Example:

```json
{
  "name": "My famous soup",
  "recipe": "Ingredients: ..."
}
```

### Attachment URL generation

The return object for the `generateAttachmentUploadUrl` function. Contains the pre-signed URL to upload the
attachment with a validity of 5 min.
Also contains the URL under which the attachment would be downloadable if it was uploaded.

```json
{
  "attachmentUploadUrl": "https://some-bucket.s3.region.amazonaws.com/5c37344f-2af2-4876-b70b-546d0cf7f0a5?someauthorizationstring",
  "attachmentDownloadUrl": "https://some-bucket.s3.region.amazonaws.com/5c37344f-2af2-4876-b70b-546d0cf7f0a5"
}
```

### Attachment

An attachment can be any object which makes sense for the client, e.g. an image. Each recipe item can have zero or one
attachment. No other restriction so far.

## Data model enforcement

Data model correctness in recipe creation and recipe update towards the application is enforced via
JSON schema verification on the API gateway.
As there is no requirement on shape or size of objects stored in S3, there is no check for S3.

## Authentication and authorization

Authentication is done via _Auth0_ and asymmetrically encrypted JWT tokens.
Authorization is implemented via a Lambda authorizer (formerly known as a custom authorizer) using the API Gateway.

## Functions

### `auth`

A function implementing the Lambda authorizer (formerly known as a custom authorizer) for the API Gateway.

### `getRecipes`

A function to return all recipe items for the user requesting it.
The user id is extracted from the JWT token that is sent by the client.
The function returns the list of recipe items using the recipe items model shown above.

### `createRecipe`

A function to create a new recipe item for the user requesting it.
The user id is extracted from the JWT token that is sent by the client.
The request must follow the creation request model shown above, which is enforced.
The answer contains the new recipe using the recipe item model as shown above.

### `updateRecipe`

A function to update a recipe item for the user requesting it.
The user id is extracted from the JWT token that is sent by the client.
The id of the recipe item that should be updated is passed as a URL parameter.
The request must follow the update request model shown above, which is enforced.
It returns an empty answer.

### `deleteRecipe`

A function to delete a recipe and the associated attachment for the user requesting it.
The id of the recipe item that should be deleted is passed as a URL parameter.
It returns an empty answer.

### `generateAttachmentUploadUrl`

A function to return a pre-signed URL that can be used to upload an attachment object for a recipe item
for the user requesting it.
The user id is extracted from the JWT token that is sent by the client.
The id of the recipe item for which an attachment URL should be generated is passed as a URL parameter.

It returns an upload URL and a download URL using the model of the attachment URL generation as shown above.

### `deleteAttachment`

A function to delete an attachment object for a recipe item for the user requesting it.
The user id is extracted from the JWT token that is sent by the client.
The id of the recipe item for which the attachment URL should be deleted is passed as a URL parameter.
It is no error if the attachment object which should be deleted does not exist.

## Logging

The application uses structured logging which end up in CloudWatch.

## Distributed tracing

The application uses distributed tracing via X-Ray.

# Postman 'Frontend'

## Authentication
//todo

## Prepared statements

### Get all recipes
Gets all recipes of the user represented by the JWT token.
Built-in tests check on HTTP return code 200 and schema of the answer.

### Create recipe
Creates a new recipe for the user represented by the JWT token.
Built-in tests check on HTTP return code 201 and schema of the answer.

### Create recipe - Malformed
Creates a malformed request for a new recipe which will be rejected by API gateway schema checks.
Built-in tests check on HTTP return code 400 and content of failure message.

