import {cors} from 'middy/middlewares'
import 'source-map-support/register'
import {APIGatewayProxyEvent, APIGatewayProxyResult} from 'aws-lambda'
import {createRecipeItem} from '../../businesslogic/RecipeItems'
import {getUserId} from '../utils'
import {createLogger} from '../../utils/logger'

const middy = require('middy')
const logger = createLogger('createRecipeItem')

export const handler = middy(async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
    logger.info('Processing event', {event})

    const userId = getUserId(event)
    const recipeItemRequest = JSON.parse(event.body)
    const recipeItem = await createRecipeItem(userId, recipeItemRequest)

    logger.info('Returning', {recipeItem})
    return {
        statusCode: 201,
        body: JSON.stringify(recipeItem)
    }
})

handler.use(
    cors({
        credentials: true
    })
)
