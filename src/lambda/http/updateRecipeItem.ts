import 'source-map-support/register'
import {APIGatewayProxyEvent, APIGatewayProxyResult} from 'aws-lambda'
import {cors} from 'middy/middlewares'
import {createLogger} from '../../utils/logger'
import {getUserId} from '../utils'
import {updateRecipeItem} from '../../businesslogic/RecipeItems'

const middy = require("middy")
const logger = createLogger('updateRecipeItem')

export const handler = middy(async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
    logger.info('Processing event', event)

    const userId = getUserId(event)
    const recipeId = event.pathParameters.recipeId
    const recipeItemRequest = JSON.parse(event.body)
    await updateRecipeItem(userId, recipeId, recipeItemRequest)

    logger.info('Returning 204')
    return {
        statusCode: 204,
        body: ''
    }
})

handler.use(
    cors({
        credentials: true
    })
)
