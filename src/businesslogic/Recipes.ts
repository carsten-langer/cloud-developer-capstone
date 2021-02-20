import {Recipe} from '../models/Recipe'
import {RecipesAccess} from '../datalayer/RecipesAccess'

const recipesAccess = new RecipesAccess()

export async function getRecipeItems(userId: string): Promise<Recipe[]> {
    return recipesAccess.getRecipes(userId)
}
