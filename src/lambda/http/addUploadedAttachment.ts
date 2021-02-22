import 'source-map-support/register'
import {createLogger} from '../../utils/logger'
import {S3Event, S3Handler} from 'aws-lambda/trigger/s3'
import {addUploadedAttachment} from '../../businesslogic/RecipeItems'

const logger = createLogger('addUploadedAttachment')

export const handler: S3Handler = async (event: S3Event): Promise<void> => {
    logger.info('Processing event', {event})

    for (const s3EventRecord of event.Records) {
        const key = s3EventRecord.s3.object.key
        logger.info('Processing S3 key', {key})
        await addUploadedAttachment(key)
    }

    logger.info('Returning void')
}
