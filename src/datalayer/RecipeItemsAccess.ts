import * as AWS from 'aws-sdk'
import {DocumentClient} from 'aws-sdk/clients/dynamodb'
import {createLogger} from '../utils/logger'
import {RecipeItem} from '../models/RecipeItem'
import {RecipeItemRequest} from '../requests/RecipeItemRequest'

const AWSXRay = require('aws-xray-sdk')
const XAWS = AWSXRay.captureAWS(AWS)
const logger = createLogger('RecipeItemsAccess')

export class RecipeItemsAccess {
    constructor(
        private readonly docClient: DocumentClient = createDynamoDBClient(),
        private readonly recipeItemsTable = process.env.RECIPE_ITEMS_TABLE) {
    }

    async getRecipeItems(userId: string): Promise<RecipeItem[]> {
        logger.info('getRecipeItems', {userId})
        const result = await this.docClient.query({
            TableName: this.recipeItemsTable,
            KeyConditionExpression: 'userId = :userId',
            ExpressionAttributeValues: {':userId': userId},
            ScanIndexForward: true
        }).promise()
        return result.Items as RecipeItem[]
    }

    async createRecipeItem(recipeItem: RecipeItem): Promise<void> {
        logger.info('createRecipeItem', {recipeItem})
        await this.docClient.put({
            TableName: this.recipeItemsTable,
            Item: {...recipeItem}
        }).promise()
    }

    async updateRecipeItem(userId: string, recipeId: string, recipeItemRequest: RecipeItemRequest): Promise<void> {
        logger.info('updateRecipeItem', {userId, recipeId, recipeItemRequest})
        await this.docClient.update({
            TableName: this.recipeItemsTable,
            Key: {
                userId: userId,
                recipeId: recipeId
            },
            ExpressionAttributeNames: {'#name': 'name'},
            ExpressionAttributeValues: {
                ':name': recipeItemRequest.name,
                ':recipe': recipeItemRequest.recipe
            },
            UpdateExpression: 'SET #name = :name, recipe = :recipe',
        }).promise()
    }

    async updateRecipeItemAttachment(userId: string, recipeId: string, attachmentUrl: string): Promise<void> {
        logger.info('updateRecipeItemAttachment', {userId, recipeId, attachmentUrl})
        await this.docClient.update({
            TableName: this.recipeItemsTable,
            Key: {
                userId: userId,
                recipeId: recipeId
            },
            ExpressionAttributeValues: {
                ':attachmentUrl': attachmentUrl
            },
            UpdateExpression: 'SET attachmentUrl = :attachmentUrl',
        }).promise()
    }

    async deleteRecipeItemAttachment(userId: string, recipeId: string): Promise<void> {
        logger.info('deleteRecipeItemAttachment', {userId, recipeId})
        await this.docClient.update({
            TableName: this.recipeItemsTable,
            Key: {
                userId: userId,
                recipeId: recipeId
            },
            UpdateExpression: 'REMOVE attachmentUrl',
        }).promise()
    }
}

function createDynamoDBClient() {
    if (process.env.IS_OFFLINE) {
        logger.info('Creating a local DynamoDB instance')
        return new XAWS.DynamoDB.DocumentClient({
            region: 'localhost',
            endpoint: 'http://localhost:8000'
        })
    }
    return new XAWS.DynamoDB.DocumentClient()
}
