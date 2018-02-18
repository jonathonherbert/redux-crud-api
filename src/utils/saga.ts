import noop from 'lodash/noop'
import Actions, { createAction } from 'redux-actions'

const metaCreator = (_: any, resolve = noop, reject = noop) => ({ resolve, reject })

export const createPromiseAction = (type: any, payloadCreator: any) => createAction(type, payloadCreator, metaCreator)

export const bindActionToPromise = (dispatch: (action: any) => any, actionCreator: (payload: any, resolve: any, reject: any) => any) => (payload: any) => {
	return new Promise((resolve, reject) => dispatch(actionCreator(payload, resolve, reject)))
}
