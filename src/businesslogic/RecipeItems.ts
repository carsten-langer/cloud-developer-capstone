import {RecipeItem} from '../models/RecipeItem'
import {RecipeItemsAccess} from '../datalayer/RecipeItemsAccess'
import {RecipeItemRequest} from '../requests/RecipeItemRequest'
import {v4 as uuidv4} from 'uuid'
import {AttachmentsAccess} from '../datalayer/AttachmentsAccess'
import {createLogger} from '../utils/logger'

const logger = createLogger('businesslogic')
const recipeItemsAccess = new RecipeItemsAccess()
const attachmentsAccess = new AttachmentsAccess()

export async function getRecipeItems(userId: string): Promise<RecipeItem[]> {
    return recipeItemsAccess.getRecipeItems(userId)
}

export async function createRecipeItem(userId: string, recipeItemRequest: RecipeItemRequest): Promise<RecipeItem> {
    const recipeId = uuidv4()

    const recipeItem = {
        userId: userId,
        recipeId: recipeId,
        name: recipeItemRequest.name,
        recipe: recipeItemRequest.recipe
    }

    await recipeItemsAccess.createRecipeItem(recipeItem)
    return recipeItem
}

export async function updateRecipeItem(userId: string, recipeId: string, recipeItemRequest: RecipeItemRequest): Promise<void> {
    return recipeItemsAccess.updateRecipeItem(userId, recipeId, recipeItemRequest)
}

export async function generateUrls(userId: string, recipeId: string): Promise<{ downloadUrl: string, uploadUrl: string }> {
    logger.info("generateUrls", {userId, recipeId})
    const key = encodeURIComponent(userId) + '/' + encodeURIComponent(recipeId)
    return attachmentsAccess.generateUrls(key)
}

export async function addUploadedAttachment(key: string): Promise<void> {
    logger.info("addUploadedAttachment-1", {key})
    const split = key.split('/')
    const userId = decodeURIComponent(decodeURIComponent(split[0]))
    const recipeId = decodeURIComponent(decodeURIComponent(split[1]))
    const reEncodedKey = encodeURIComponent(userId) + '/' + encodeURIComponent(recipeId)
    const url = attachmentsAccess.generateUrls(reEncodedKey).downloadUrl

    logger.info("addUploadedAttachment-2", {url, split, userId, recipeId})

    return recipeItemsAccess.updateRecipeItemAttachment(userId, recipeId, url)
}

export async function deleteAttachment(userId: string, recipeId: string): Promise<void> {
    logger.info("deleteAttachment", {userId, recipeId})
    //const key = userId + '/' + recipeId
}
