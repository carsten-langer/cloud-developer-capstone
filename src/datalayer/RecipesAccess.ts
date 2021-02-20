import * as AWS from 'aws-sdk'
import {DocumentClient} from 'aws-sdk/clients/dynamodb'
import {createLogger} from '../utils/logger'
import {Recipe} from '../models/Recipe'

const AWSXRay = require('aws-xray-sdk')
const XAWS = AWSXRay.captureAWS(AWS)
const logger = createLogger('RecipesAccess')

export class RecipesAccess {
    constructor(
        private readonly docClient: DocumentClient = createDynamoDBClient(),
        private readonly recipesTable = process.env.RECIPES_TABLE) {
    }

    async getRecipes(userId: string): Promise<Recipe[]> {
        logger.info('getRecipes', userId)
        const result = await this.docClient.query({
            TableName: this.recipesTable,
            KeyConditionExpression: 'userId = :userId',
            ExpressionAttributeValues: {':userId': userId},
            ScanIndexForward: true
        }).promise()
        return result.Items as Recipe[]
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
