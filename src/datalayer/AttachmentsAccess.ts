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

    generateUploadUrl(attachmentId: string): { downloadUrl: string, uploadUrl: string } {
        const uploadUrl = this.s3Client.getSignedUrl('putObject', {
            Bucket: this.bucket,
            Key: attachmentId,
            Expires: parseInt(urlExpiration)
        })
        const downloadUrl = uploadUrl.split('?')[0]
        logger.info('generateUploadUrl', {downloadUrl, uploadUrl})
        return {downloadUrl, uploadUrl}
    }
}

function createS3Client() {
    return new XAWS.S3({signatureVersion: 'v4'})
}
