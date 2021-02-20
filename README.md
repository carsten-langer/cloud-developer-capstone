# Cloud Developer Capstone Project

This project chooses option 2 _serverless_ according to the
[project rubric](https://review.udacity.com/#!/rubrics/2578/view).

It builds on top of my solution to the project for module 5 _Develop and Deploy Serverless Apps_, which is the backend
for an TODO application. According to [this discussion](https://knowledge.udacity.com/questions/152333)
reusing this project's code base is accepted.

Compared to the TODO application, this project features:

- Data model changed and extended with more fields.
- Data model has constraints on the fields, e.g. min/max string size, which a client like a UI is supposed to check
  before sending requests to this backend application.
- One item can have more than one attachment, thus the attachment's ID cannot simply be the item's ID as it was in the
  TODO project.
- The item's list of attachments as stored in DynamoDB only contains those attachments that are really existent in S3,
  by means of S3 notifying the backend via SNS that an object was uploaded. That is, a client asking the backend for an
  upload URL but then not uploading an object would not lead anymore to the backend assuming an object was in S3.
- A client can delete an attachment without deleting the item.
- Deleting an item from DynamoDB deletes all attachments from S3 as well.

As the focus is on backend programming, I do not provide a frontend client, but rather a Postman collection, as
suggested in [this discussion](https://knowledge.udacity.com/questions/406740).

# Functionality of the application - Cooking Recipes Store

This application is the backend for storing cooking recipes. It will allow creating/removing/updating/fetching recipe
items. Each recipe item can optionally have one or several attachment image, e.g. of intermediate steps or the final
product. Attach items can only be created after the recipe item was created. Attach items can be deleted without the
recipe item being deleted. Each user only has access to recipe items that s/he has created.

# Architecture

The application stores recipe items as JSON structure in DynamoDB and attachments as objects in S3.

## Data models

### Recipe item

Each recipe item stored in DynamoDB and returned to the client on recipe item creation requests contains
the following fields:

- `userId` (string) - id of the user owning this item
- `recipeId` (string) - a unique id for an item
- `name` (string, min 1, max 100 chars) - name of a recipe item (e.g. "My famous soup")
- `recipe` (string, min 1, max 10000 chars) - recipe itself in a form that the user can enter easily, and the client can
  render nicely, e.g. MarkDown
- `attachments` (list of string, potentially empty, no upper boundary so far) - a list of URLs pointing to objects
  attached to a recipe item. Objects themselves are stored in S3.

Example:

```json
{
  "userId": "google-oauth2|11345",
  "recipeId": "5c37344f-2af2-4876-b70b-546d0cf7f0a5",
  "name": "My famous soup",
  "recipe": "Ingredients: ...",
  "attachments": [
    "https://some-bucket.s3.region.amazonaws.com/123...",
    "https://some-bucket.s3.region.amazonaws.com/456..."
  ]
}
```

### Recipe items
The list of recipe items returned by the request for all recipes of a user is an object containing a single property
`recipes` being a list of recipe items.

Example:

```json
{
  "recipes": [
    {
      "userId": "google-oauth2|11345",
      "recipeId": "5c37344f-2af2-4876-b70b-546d0cf7f0a5",
      "name": "My famous soup",
      "recipe": "Ingredients: ...",
      "attachments": [
        "https://some-bucket.s3.region.amazonaws.com/123...",
        "https://some-bucket.s3.region.amazonaws.com/456..."
      ]
    },
    {
      "userId": "google-oauth2|11345",
      "recipeId": "6325652a-026c-4e1c-b454-8b7bb0d5f48c",
      "name": "My famous desert",
      "recipe": "For this delicious desert you take ...",
      "attachments": []
    }
  ]
}
```

### Recipe item creation or update request

Each recipe item creation or update request contains the following fields:

- `name` (string, min 1, max 100 chars) - name of a recipe item (e.g. "My famous soup")
- `recipe` (string, min 1, max 10000 chars) - recipe itself in a form that the user can enter easily, and the client can
  render nicely, e.g. MarkDown

Example:

```json
{
  "name": "My famous soup",
  "recipe": "Ingredients: ..."
}
```

### Attachment upload URL

The return object for the `generateAttachmentUploadUrl` function.

```json
{
  "attachmentUploadUrl": "https://some-bucket.s3.region.amazonaws.com/456...?someauthorizationstring"
}
```

### Attachment deletion URL

The request object for the `deleteAttachment` function.

- `attachmentDeletionUrl` (string, min 1, max 1000 chars) - URL of the to be deleted attachment, same as found as
  an item in the list of `attachments` in the recipe item model.

Example:

```json
{
  "attachmentDeletionUrl": "https://some-bucket.s3.region.amazonaws.com/456..."
}
```

### Attachment

An attachment can be any object which makes sense for the client, e.g. an image. No restriction on number nor size so
far.

## Data model enforcement

Data model correctness in recipe creation, recipe update and attachment deletion requests towards application is
enforced via JSON schema verification on the API gateway.
As there is no requirement on shape or size of objects stored in S3, there is no check for S3.

## Authentication and authorization

Authentication is done via _Auth0_ and asymmetrically encrypted JWT tokens. Authorization is implemented via a custom
authorizer for the API Gateway.

## Functions

### `auth`

A function implementing a custom authorizer for API Gateway that is added to all other functions.

### `getRecipes`

A function to return all recipes for the user requesting it.
The user id is extracted from the JWT token that is sent by the client.
The function returns the list of recipe items using the recipe items model shown above.

### `createRecipe`

A function to create a new recipe for the user requesting it.
The user id is extracted from the JWT token that is sent by the client.
The request must follow the creation request model shown above, which is enforced.
The answer contains the new recipe using the recipe item model as shown above.

### `updateRecipe`

A function to update a recipe for the user requesting it.
The user id is extracted from the JWT token that is sent by the client.
The id of the recipe item that should be updated is passed as a URL parameter.
The request must follow the update request model shown above, which is enforced.
It returns an empty answer.

### `deleteRecipe`

A function to delete a recipe and all associated attachments for the user requesting it.
The id of the recipe item that should be deleted is passed as a URL parameter.
It returns an empty answer.

### `generateAttachmentUploadUrl`

A function to return pre-signed URL that can be used to upload an attachment object for a recipe item
for the user requesting it.
The user id is extracted from the JWT token that is sent by the client.
The id of the recipe item for which an attachment URL should be generated is passed as a URL parameter.

It returns an upload URL using the model of the attachment upload URL as shown above.

### `deleteAttachment`

A function to delete an attachment object for a recipe item for the user requesting it.
The user id is extracted from the JWT token that is sent by the client.
The id of the recipe item for which an attachment URL should be generated is passed as a URL parameter.

It returns a JSON object that looks like this:

```json
{
  "attachmentUrl": "https://some-bucket.s3.region.amazonaws.com/456...?someauthorizationstring"
}
```

## Logging

The application uses structured logging which end up in CloudWatch.

## Distributed tracing

The application uses distributed tracing via X-Ray.

# Postman 'Frontend'

## Authentication
//todo

## Prepared statements
//todo
