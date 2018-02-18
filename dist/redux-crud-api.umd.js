(function (global, factory) {
	typeof exports === 'object' && typeof module !== 'undefined' ? module.exports = factory(require('lodash/filter'), require('lodash/find'), require('lodash/identity'), require('lodash/kebabCase'), require('lodash/orderBy'), require('normalizr'), require('querystring'), require('redux-batched-actions'), require('redux-crud'), require('redux-saga'), require('redux-saga/effects'), require('uuid/v4'), require('whatwg-fetch'), require('lodash/noop'), require('redux-actions')) :
	typeof define === 'function' && define.amd ? define(['lodash/filter', 'lodash/find', 'lodash/identity', 'lodash/kebabCase', 'lodash/orderBy', 'normalizr', 'querystring', 'redux-batched-actions', 'redux-crud', 'redux-saga', 'redux-saga/effects', 'uuid/v4', 'whatwg-fetch', 'lodash/noop', 'redux-actions'], factory) :
	(global.reduxCrudApi = factory(global.filter,global.find,global.identity,global.kebabCase,global.orderBy,global.normalizr,global.qs,global.reduxBatchedActions,global.reduxCrud,global.reduxSaga,global.effects,global.v4,null,global.noop,global.reduxActions));
}(this, (function (filter,find,identity,kebabCase,orderBy,normalizr,qs,reduxBatchedActions,reduxCrud,reduxSaga,effects,v4,whatwgFetch,noop,reduxActions) { 'use strict';

filter = filter && filter.hasOwnProperty('default') ? filter['default'] : filter;
find = find && find.hasOwnProperty('default') ? find['default'] : find;
identity = identity && identity.hasOwnProperty('default') ? identity['default'] : identity;
kebabCase = kebabCase && kebabCase.hasOwnProperty('default') ? kebabCase['default'] : kebabCase;
orderBy = orderBy && orderBy.hasOwnProperty('default') ? orderBy['default'] : orderBy;
reduxCrud = reduxCrud && reduxCrud.hasOwnProperty('default') ? reduxCrud['default'] : reduxCrud;
v4 = v4 && v4.hasOwnProperty('default') ? v4['default'] : v4;
noop = noop && noop.hasOwnProperty('default') ? noop['default'] : noop;

const metaCreator = (_, resolve = noop, reject = noop) => ({ resolve, reject });
const createPromiseAction = (type, payloadCreator) => reduxActions.createAction(type, payloadCreator, metaCreator);

// The names we use for actions don't map to the redux-crud action names, so we do that here.
const mapActionToCRUDAction = {
    create: 'create',
    del: 'delete',
    fetch: 'fetch',
    search: 'fetch',
    update: 'update',
};
// The names we use for actions also must map to the http methods.
const mapActionToHTTPMethod = {
    create: 'post',
    update: 'put',
    del: 'delete',
    fetch: 'get',
    search: 'get',
};
// The default actions available.
const availableActions = ['create', 'update', 'del', 'fetch', 'search'];
/**
 * Creates a saga that handles API operations.
 * Updates optimistically when updating or creating.
 *
 * @param {ICreateAPIActionOptions}
 */
function createAPIAction({ resourceName, baseUrl, actionCreators, actionName, method, selectAuthToken, selectors, relations, transformIn, transformOut }) {
    /**
     * Generator for the given action.
     * Accepts FSA containing a payload with property 'resource' containing request data.
     * Dispatches start (if applicable) action, makes HTTP calls, dispatches success/error actions with result.
     *
     * @param {FSA} action
     *  {
     * 		payload: {
     * 			resource: any  The resource. This is named grossly right now.
     * 				Really it's whatever params the op needs to work, e.g.
     * 				an ID, search params, a whole model. The ambiguity is rubbish.
     * 			options: {
     * 				endpoint: string  An endpoint to add to the default REST request.
     * 			}
     * 		},
     * 		meta: {
     * 			resolve: Function  The function called when the saga is done
     * 			reject: Function  The function called if the saga throws
     * 		}
     *  }
     */
    return function* ({ payload, meta: { resolve, reject } }) {
        // We store a client id here for optimistic creation
        let resource;
        let options;
        let cid;
        const relationKeys = {};
        const crudAction = mapActionToCRUDAction[actionName];
        if (payload) {
            ({ resource, options } = payload);
        }
        let localResource = Object.assign({}, resource);
        // If we're creating a record, give it the client id if it doesn't have one already
        if (actionName === 'create') {
            if (localResource.id) {
                cid = localResource.id;
            }
            else {
                cid = localResource.id = v4();
            }
        }
        // If we're updating a model, merge it with what's current in the state
        if (actionName === 'update') {
            const modelFromState = yield effects.select(selectors.findById, localResource.id);
            if (!modelFromState) {
                yield effects.call(reject, `Could not select model with id ${resource.id}`);
            }
            localResource = Object.assign({}, modelFromState, localResource);
        }
        // Dispatch our start action, if there is one for the given action
        if (resource && actionCreators[crudAction + 'Start']) {
            if (relations && (actionName === 'update' || actionName === 'create')) {
                const schema = Array.isArray(localResource) ? [relations.schema] : relations.schema;
                const normalisedResource = normalizr.normalize(localResource, schema);
                for (const i in relations.map) {
                    const relationData = normalisedResource.entities[i];
                    if (!relationData) {
                        continue;
                    }
                    // We store relation keys (cids) in order here.
                    // When we receive relation updates at the end of the action,
                    // we can replay these keys in order to sync with optimistic updates.
                    relationKeys[i] = [];
                    const actions = [];
                    if (relationData.undefined) {
                        console.warn(`One or more of the relations you\'re trying to ${actionName} is missing an id.\
							Bad things are likely to happen as a result.`);
                    }
                    Object.keys(relationData).forEach(id => {
                        relationKeys[i].push(id);
                        actions.push(relations.map[i][crudAction + 'Start'](relationData[id]));
                    });
                    yield effects.put(reduxBatchedActions.batchActions(actions));
                }
            }
            else {
                yield effects.put(actionCreators[crudAction + 'Start'](localResource));
            }
        }
        // Build the request string
        let requestString = `${baseUrl}/${kebabCase(resourceName)}`;
        // If we have a specific resource or request type, append it to request URL
        if ((method === 'get' && actionName !== 'search' && localResource.id) || method === 'delete' || method === 'put') {
            requestString += `/${localResource.id}`;
        }
        if (actionName === 'search') {
            requestString += '/search';
        }
        if (options && options.endpoint) {
            requestString += `/${options.endpoint}`;
        }
        const requestOptions = {
            method: method.toUpperCase(),
            headers: new Headers(),
        };
        // Add the request body if we're sending data
        if (method === 'post' || method === 'put') {
            const contentType = options && options.contentType ? options.contentType : 'application/json';
            const resourceToSend = transformOut(Object.assign({}, localResource));
            if (actionName === 'create') {
                delete resourceToSend.id;
            }
            if (contentType !== 'multipart/form-data') {
                requestOptions.headers.append('content-type', contentType);
            }
            requestOptions.body = createRequestBody(contentType, resourceToSend);
        }
        if (actionName === 'search') {
            requestString += `?${qs.stringify(localResource)}`;
        }
        // Add the authentication code to the header, if we have a selector
        if (selectAuthToken) {
            const token = yield effects.select(selectAuthToken);
            requestOptions.headers.append('Authorization', `Bearer ${token}`);
        }
        // Make the request and handle the response
        try {
            const response = yield effects.call(fetch, requestString, requestOptions);
            if (response.status < 200 || response.status > 299) {
                throw new Error(`HTTP Error: ${response.status}`);
            }
            let data;
            if (actionName === 'del') {
                data = localResource;
            }
            else {
                // We take the data from the 'data' envelope, if it exists,
                // or from the json directly if it doesn't.
                // It'd be good to let the user provide an envelope.
                const json = yield effects.apply(response, response.json);
                data = json.data ? json.data : json;
                // Apply transforms
                const dataIsArray = Array.isArray(data);
                if (dataIsArray) {
                    data = data.map((item) => transformIn(item));
                }
                else {
                    data = transformIn(data);
                }
            }
            // If there aren't any relations or we're not running a fetch or update, do a basic persist
            if (!relations
                || (crudAction !== 'fetch'
                    && crudAction !== 'update')) {
                if (actionName === 'create') {
                    yield effects.put(actionCreators[crudAction + 'Success'](data, cid));
                }
                else {
                    yield effects.put(actionCreators[crudAction + 'Success'](data));
                }
            }
            else {
                // If we do have relations, normalise the incoming data, and dispatch persist
                // operations for each model. We check here to see if the data is an array (collection),
                // and adjust the schema accordingly.
                const normalisedData = normalizr.normalize(data, Array.isArray(data) ? [relations.schema] : relations.schema);
                for (const i in relations.map) {
                    const relationData = normalisedData.entities[i];
                    if (!relationData) {
                        continue;
                    }
                    const actions = [];
                    Object.keys(relationData).forEach((id, index) => {
                        if (crudAction === 'fetch') {
                            actions.push(relations.map[i][crudAction + 'Success'](relationData[id]));
                        }
                        else {
                            // We use the previously stored cid to reconcile updates here.
                            // It's imperative that relations come back in the same order they went out!
                            actions.push(relations.map[i][crudAction + 'Success'](relationData[id], relationKeys[i] ? relationKeys[i][index] : null));
                        }
                    });
                    yield effects.put(reduxBatchedActions.batchActions(actions));
                }
            }
            // Once we're done, call resolve for the Promise caller
            yield effects.call(resolve, data);
        }
        catch (e) {
            if (method === 'get') {
                yield effects.put(actionCreators[crudAction + 'Error'](e.message));
            }
            else {
                // Methods that persist data require the resource to revert optimistic updates
                yield effects.put(actionCreators[crudAction + 'Error'](e.message, localResource));
            }
            // Call reject for the Promise caller
            yield effects.call(reject, e.message);
        }
    };
}
// Selectors
// ---------
/**
 * Create selectors for the given resource namespace.
 *
 * @param {string} resourceName - The name of the resource as appears in the state
 * @return {any} Object with selector methods
 */
function createSelectors(resourceName) {
    return {
        /**
         * @inheritdocs
         */
        findById(state, id) {
            return state[resourceName][id] || null;
        },
        /**
         * @inheritdocs
         */
        findByCid(state, cid) {
            return find(state[resourceName], (item) => item._cid === cid);
        },
        /**
         * @inheritdocs
         */
        filter(state, predicate) {
            return filter(state[resourceName], predicate);
        },
        orderBy(state, predicate, order) {
            return orderBy(state[resourceName], predicate, order);
        },
        /**
         * @inheritdocs
         */
        findAll(state) {
            return state[resourceName];
        }
    };
}
/**
 * Creates an object with api methods keyed by name.
 * All of these actions can be dispatched as normal.
 * They will dispatch start (where available), success and error actions
 * in turn, making the http request to the API, the idea being, generic CRUD.
 *
 * @returns {IAPIResource}
 */
function createAPIResource({ resourceName, baseUrl, actions = availableActions, selectAuthToken, relations, options = {
    transformIn: identity,
    transformOut: identity,
} }) {
    const actionCreators = reduxCrud.actionCreatorsFor(resourceName);
    const selectors = createSelectors(resourceName);
    const apiResource = {
        workers: {},
        sagas: {},
        actions: actionCreators,
        actionNames: reduxCrud.actionTypesFor(resourceName),
        selectors,
        reducers: reduxCrud.Map.reducersFor(resourceName)
    };
    // Create a resource for each of our actions
    actions.forEach((actionName) => {
        if (!mapActionToHTTPMethod[actionName]) {
            throw new Error(`Method ${actionName} not supported for resource ${resourceName}`);
        }
        // Create the action constant
        apiResource.actionNames[actionName] = `${resourceName.toUpperCase()}_${actionName.toUpperCase()}`;
        // Create the request FSA
        apiResource.actions[actionName] = createPromiseAction(apiResource.actionNames[actionName], identity);
        // If we've got relations, add the root relation to the relations map.
        // This saves us doing it for every persist operation, and lets us iterate
        // over the whole resource with the relations map.
        if (relations) {
            relations.map[resourceName] = actionCreators;
        }
        // Create the worker saga
        apiResource.workers[actionName] = createAPIAction({
            resourceName,
            baseUrl,
            actionCreators,
            selectors,
            actionName,
            method: mapActionToHTTPMethod[actionName],
            selectAuthToken,
            relations,
            transformIn: options.transformIn || identity,
            transformOut: options.transformOut || identity
        });
        // Create the watcher saga
        apiResource.sagas[actionName] = function* () {
            yield effects.call(reduxSaga.takeLatest, apiResource.actionNames[actionName], apiResource.workers[actionName]);
        };
    });
    return apiResource;
}
/**
 * Creates a request body given a content type.
 *
 * @param {string} contentType e.g. application/json
 * @param {any} resource The resource to send.
 * @return {any} The request body data
 */
function createRequestBody(contentType, resource) {
    switch (contentType) {
        case 'application/json':
            return JSON.stringify(resource);
        case 'multipart/form-data':
            const formData = new FormData();
            for (const name in resource) {
                formData.append(name, resource[name]);
            }
            return formData;
        default:
            throw new Error(`Could not create request body: there is no handler for content-type: ${contentType}`);
    }
}

return createAPIResource;

})));
//# sourceMappingURL=redux-crud-api.umd.js.map
