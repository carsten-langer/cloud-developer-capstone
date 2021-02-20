import 'source-map-support/register'
import {APIGatewayProxyEvent, APIGatewayProxyResult} from 'aws-lambda'
import {cors} from 'middy/middlewares'
import {getRecipeItems} from '../../businesslogic/Recipes'
import {getUserId} from '../utils'
import {createLogger} from '../../utils/logger'

const middy = require('middy')
const logger = createLogger('getRecipes')

export const handler = middy(async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
    logger.info('Processing event', event)

    const userId = getUserId(event)
    const recipesResult = {recipes: await getRecipeItems(userId)}

    logger.info('Returning', recipesResult)
    return {
        statusCode: 200,
        body: JSON.stringify(recipesResult)
    }
})

handler.use(
    cors({
        credentials: true
    })
)
