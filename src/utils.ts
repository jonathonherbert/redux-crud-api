import { mapActionTypeToActionName } from './constants'
import { IActionOptions } from './createAPIResource'
import { normalize, Schema } from 'normalizr'

/**
 * Get actions for incoming data for which data is stored in a nested format
 * described by the data's normalizr schema.
 */
export const getActionsForNestedRelations = (options: IActionOptions) => {
  const { data, relations } = options
  // If we do have relations, normalise the incoming data, and dispatch persist
  // operations for each model. We check here to see if the data is an array (collection),
  // and adjust the schema accordingly.
  const normalisedData = normalize(
    data,
    Array.isArray(data) ? ([relations.schema] as Schema) : relations.schema
  )
  return getActionsFromData(options, normalisedData.entities)
}

/**
 * Get actions from the user data.
 */
const getActionsFromData = (
  { relations, crudAction, relationKeys, actionCreators, resourceName }: IActionOptions,
  data: any
) => {
  const actions: any[] = []
  const successActionName = mapActionTypeToActionName.success[crudAction]
  // Include the base resource name if it's not already present.
  const resourceNames = new Set([...Object.keys(relations.map), resourceName])
  resourceNames.forEach(resourceName => {
    const relationData = data[resourceName]
    if (!relationData) {
      return
    }
    // Our data could be an array, or a collection of resources keyed by ids.
    const relationItems = Array.isArray(relationData) ? relationData : Object.values(relationData)
    relationItems.forEach((relationItem, index) => {
      if (crudAction === 'fetch') {
        actions.push(relations.map[resourceName][successActionName](relationItem))
      } else {
        // We use the previously stored cid to reconcile updates here.
        // It's imperative that relations come back in the same order they went out!
        actions.push(
          relations.map[resourceName][successActionName](
            relationItem,
            relationKeys[resourceName] ? relationKeys[resourceName][index] : null
          )
        )
      }
    })
  })
  if (!actions.length) {
    // If we haven't received any data, add a single success event.
    // This will ensure that busy indicators are reset etc., and any
    // consumer code watching for success actions will fire as expected.
    actions.push(actionCreators[successActionName]([]))
  }
  return actions
}

/**
 * Get actions from incoming data for which data is stored in the format:
 * {[entityName: string]: Entity|Entity[]}
 */
export const getActionsForFlattenedRelations = (options: IActionOptions) =>
  getActionsFromData(options, options.data)
