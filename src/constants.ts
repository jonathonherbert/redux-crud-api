// The action names as they're referred to on the actions object.
export type TActionNames = 'create' | 'del' | 'fetch' | 'search' | 'update'
// The action names as they're referred to on individual actions.
export type TCrudActionTypes = 'create' | 'delete' | 'fetch' | 'fetch' | 'update'
export type TCrudActionNamesStart =
  | 'createStart'
  | 'deleteStart'
  | 'fetchStart'
  | 'fetchStart'
  | 'updateStart'
export type TCrudActionNamesSuccess =
  | 'createSuccess'
  | 'deleteSuccess'
  | 'fetchSuccess'
  | 'fetchSuccess'
  | 'updateSuccess'
export type TCrudActionNamesError =
  | 'createError'
  | 'deleteError'
  | 'fetchError'
  | 'fetchError'
  | 'updateError'
export type TCrudActionCategories = 'start' | 'success' | 'error'

// The names we use for actions don't map to the redux-crud action names, so we do that here.
export const mapActionToActionType: { [actionType in TActionNames]: TCrudActionTypes } = {
  create: 'create',
  del: 'delete',
  fetch: 'fetch',
  search: 'fetch',
  update: 'update'
}

export const mapActionTypeToActionName: {
  [actionCategory in TCrudActionCategories]: {
    [actionName in TCrudActionTypes]:
      | TCrudActionNamesStart
      | TCrudActionNamesError
      | TCrudActionNamesSuccess
  }
} = {
  start: {
    create: 'createStart',
    delete: 'deleteStart',
    fetch: 'fetchStart',
    update: 'updateStart'
  },
  success: {
    create: 'createSuccess',
    delete: 'deleteSuccess',
    fetch: 'fetchSuccess',
    update: 'updateSuccess'
  },
  error: {
    create: 'createError',
    delete: 'deleteError',
    fetch: 'fetchError',
    update: 'updateError'
  }
}

export type MapActionToCRUDAction = typeof mapActionToActionType

export type ActionTypes = keyof MapActionToCRUDAction
export type CRUDActionTypes = MapActionToCRUDAction[keyof MapActionToCRUDAction]

// The names we use for actions also must map to the http methods.
export const mapActionToHTTPMethod = {
  create: 'post',
  update: 'put',
  del: 'delete',
  fetch: 'get',
  search: 'get'
} as { [action: string]: string }

// The default actions available.
export const availableActions: ActionTypes[] = ['create', 'update', 'del', 'fetch', 'search']
