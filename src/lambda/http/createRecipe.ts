import {cors} from 'middy/middlewares'
import 'source-map-support/register'
import {APIGatewayProxyEvent, APIGatewayProxyResult} from 'aws-lambda'
import {createRecipeItem} from '../../businesslogic/Recipes'
import {getUserId} from '../utils'
import {createLogger} from '../../utils/logger'

const middy = require('middy')
const logger = createLogger('createRecipe')

export const handler = middy(async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
    logger.info('Processing event', event)

    const userId = getUserId(event)
    const recipeRequest = JSON.parse(event.body)
    const recipe = await createRecipeItem(recipeRequest, userId)

    logger.info('Returning', recipe)
    return {
        statusCode: 201,
        body: JSON.stringify(recipe)
    }
})

handler.use(
    cors({
        credentials: true
    })
)
