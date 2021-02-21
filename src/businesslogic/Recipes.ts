import {Recipe} from '../models/Recipe'
import {RecipesAccess} from '../datalayer/RecipesAccess'
import {RecipeRequest} from '../requests/RecipeRequest'
import { v4 as uuidv4 } from 'uuid'
const recipesAccess = new RecipesAccess()

export async function getRecipeItems(userId: string): Promise<Recipe[]> {
    return recipesAccess.getRecipes(userId)
}

export async function createRecipeItem(recipeRequest: RecipeRequest, userId: string): Promise<Recipe> {
    const recipeId = uuidv4()

    const newRecipe: Recipe = {
        userId: userId,
        recipeId: recipeId,
        name: recipeRequest.name,
        recipe: recipeRequest.recipe
    }

    await recipesAccess.createRecipeItem(newRecipe)
    return newRecipe
}

