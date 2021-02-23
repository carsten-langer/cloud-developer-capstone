import * as AWS from 'aws-sdk'
import {createLogger} from '../utils/logger'

const AWSXRay = require('aws-xray-sdk')
const XAWS = AWSXRay.captureAWS(AWS)
const logger = createLogger('AttachmentsAccess')
const attachmentsBucket = process.env.ATTACHMENTS_S3_BUCKET
const urlExpiration = process.env.ATTACHMENTS_S3_SIGNED_URL_EXPIRATION

export class AttachmentsAccess {
    constructor(
        private readonly s3Client = createS3Client(),
        private readonly bucket = attachmentsBucket) {
    }

    generateUrls(key: string): { downloadUrl: string, uploadUrl: string } {
        const {downloadUrl, uploadUrl} = this.getSignedUrls(key)
        logger.info('generateUrls', {downloadUrl, uploadUrl})
        return {downloadUrl, uploadUrl}
    }

    private getSignedUrls(key: string): { downloadUrl: string, uploadUrl: string } {
        const uploadUrl = this.s3Client.getSignedUrl('putObject', {
            Bucket: this.bucket,
            Key: key,
            Expires: parseInt(urlExpiration)
        })
        const downloadUrl = uploadUrl.split('?')[0]
        return {downloadUrl, uploadUrl}
    }

    async deleteAttachment(key: string): Promise<void> {
        logger.info('deleteAttachment', {key})
        await this.s3Client.deleteObject( {
            Bucket: this.bucket,
            Key: key
        }).promise()
    }
}

function createS3Client() {
    return new XAWS.S3({signatureVersion: 'v4'})
}
