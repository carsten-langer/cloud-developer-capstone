import 'source-map-support/register'
import {APIGatewayProxyEvent, APIGatewayProxyResult} from 'aws-lambda'
import {cors} from 'middy/middlewares'
import {getUserId} from '../utils'
import {createLogger} from '../../utils/logger'
import {getRecipeItems} from '../../businesslogic/RecipeItems'

const middy = require('middy')
const logger = createLogger('getRecipeItems')

export const handler = middy(async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
    logger.info('Processing event', event)

    const userId = getUserId(event)
    const recipeItems = {recipes: await getRecipeItems(userId)}

    logger.info('Returning', recipeItems)
    return {
        statusCode: 200,
        body: JSON.stringify(recipeItems)
    }
})

handler.use(
    cors({
        credentials: true
    })
)
