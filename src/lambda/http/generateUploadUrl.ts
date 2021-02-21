import 'source-map-support/register'
import {APIGatewayProxyEvent, APIGatewayProxyResult} from 'aws-lambda'
import {generateUploadUrl} from '../../businesslogic/RecipeItems'
import {cors} from 'middy/middlewares'
import {createLogger} from '../../utils/logger'
import {getUserId} from '../utils'

const middy = require("middy");
const logger = createLogger('generateUploadUrl')

export const handler = middy(async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
    logger.info('Processing event', event)

    const userId = getUserId(event)
    const recipeId = event.pathParameters.recipeId
    const {downloadUrl, uploadUrl} = await generateUploadUrl(userId, recipeId)
    const urls = {
        attachmentDownloadUrl: downloadUrl,
        attachmentUploadUrl: uploadUrl
    }

    logger.info('Returning', urls)
    return {
        statusCode: 200,
        body: JSON.stringify(urls)
    }
})

handler.use(
    cors({
        credentials: true
    })
)
