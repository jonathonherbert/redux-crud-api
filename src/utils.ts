import { mapActionTypeToActionName } from './constants'
import { IActionOptions } from './createAPIResource'
import { normalize, Schema } from 'normalizr'

export const getActionsForNestedRelations = ({
  relations,
  relationKeys,
  crudAction,
  actionCreators,
  data
}: IActionOptions) => {
  const successActionName = mapActionTypeToActionName.success[crudAction]
  // If we do have relations, normalise the incoming data, and dispatch persist
  // operations for each model. We check here to see if the data is an array (collection),
  // and adjust the schema accordingly.
  const normalisedData = normalize(
    data,
    Array.isArray(data) ? ([relations.schema] as Schema) : relations.schema
  )
  const actions: any[] = []
  for (const i in relations.map) {
    const relationData = normalisedData.entities[i]
    if (!relationData) {
      continue
    }

    Object.keys(relationData).forEach((id, index) => {
      if (crudAction === 'fetch') {
        actions.push(relations.map[i][successActionName](relationData[id]))
      } else {
        // We use the previously stored cid to reconcile updates here.
        // It's imperative that relations come back in the same order they went out!
        actions.push(
          relations.map[i][successActionName](
            relationData[id],
            relationKeys[i] ? relationKeys[i][index] : null
          )
        )
      }
    })
  }
  if (!actions.length) {
    // If we haven't received any data, add a single success event.
    // This will ensure that busy indicators are reset etc., and any
    // consumer code watching for success actions will fire as expected.
    actions.push(actionCreators[successActionName]([]))
  }
  return actions
}
