import {RecipeItem} from '../models/RecipeItem'
import {RecipeItemsAccess} from '../datalayer/RecipeItemsAccess'
import {RecipeItemRequest} from '../requests/RecipeItemRequest'
import {v4 as uuidv4} from 'uuid'
import {AttachmentsAccess} from '../datalayer/AttachmentsAccess'

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

export async function generateUploadUrl(userId: string, recipeId: string): Promise<{ downloadUrl: string, uploadUrl: string }> {
    return attachmentsAccess.generateUploadUrl(userId + '/' + recipeId)
}
