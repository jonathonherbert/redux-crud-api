import noop from 'lodash/noop'
import { createAction } from 'redux-actions'

const metaCreator = (_, resolve = noop, reject = noop) => ({ resolve, reject })

export const createPromiseAction = (type, payloadCreator) => createAction(type, payloadCreator, metaCreator)

export const bindActionToPromise = (dispatch, actionCreator) => payload => {
	return new Promise((resolve, reject) => dispatch(actionCreator(payload, resolve, reject)))
}
