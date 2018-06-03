(function (global, factory) {
	typeof exports === 'object' && typeof module !== 'undefined' ? module.exports = factory(require('lodash-es/filter'), require('lodash-es/find'), require('lodash-es/identity'), require('lodash-es/kebabCase'), require('lodash-es/orderBy'), require('normalizr'), require('querystring'), require('redux-batched-actions'), require('redux-crud'), require('uuid/v4'), require('whatwg-fetch')) :
	typeof define === 'function' && define.amd ? define(['lodash-es/filter', 'lodash-es/find', 'lodash-es/identity', 'lodash-es/kebabCase', 'lodash-es/orderBy', 'normalizr', 'querystring', 'redux-batched-actions', 'redux-crud', 'uuid/v4', 'whatwg-fetch'], factory) :
	(global.reduxCrudApi = factory(global.filter,global.find,global.identity,global.kebabCase,global.orderBy,global.normalizr,global.qs,global.reduxBatchedActions,global.reduxCrud,global.v4));
}(this, (function (filter,find,identity,kebabCase,orderBy,normalizr,qs,reduxBatchedActions,reduxCrud,v4) { 'use strict';

filter = filter && filter.hasOwnProperty('default') ? filter['default'] : filter;
find = find && find.hasOwnProperty('default') ? find['default'] : find;
identity = identity && identity.hasOwnProperty('default') ? identity['default'] : identity;
kebabCase = kebabCase && kebabCase.hasOwnProperty('default') ? kebabCase['default'] : kebabCase;
orderBy = orderBy && orderBy.hasOwnProperty('default') ? orderBy['default'] : orderBy;
reduxCrud = reduxCrud && reduxCrud.hasOwnProperty('default') ? reduxCrud['default'] : reduxCrud;
v4 = v4 && v4.hasOwnProperty('default') ? v4['default'] : v4;

/*! *****************************************************************************
Copyright (c) Microsoft Corporation. All rights reserved.
Licensed under the Apache License, Version 2.0 (the "License"); you may not use
this file except in compliance with the License. You may obtain a copy of the
License at http://www.apache.org/licenses/LICENSE-2.0

THIS CODE IS PROVIDED ON AN *AS IS* BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
KIND, EITHER EXPRESS OR IMPLIED, INCLUDING WITHOUT LIMITATION ANY IMPLIED
WARRANTIES OR CONDITIONS OF TITLE, FITNESS FOR A PARTICULAR PURPOSE,
MERCHANTABLITY OR NON-INFRINGEMENT.

See the Apache Version 2.0 License for specific language governing permissions
and limitations under the License.
***************************************************************************** */
/* global Reflect, Promise */













function __awaiter(thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
}

// The names we use for actions don't map to the redux-crud action names, so we do that here.
const mapActionToCRUDAction = {
    create: "create",
    del: "delete",
    fetch: "fetch",
    search: "fetch",
    update: "update"
};
// The names we use for actions also must map to the http methods.
const mapActionToHTTPMethod = {
    create: "post",
    update: "put",
    del: "delete",
    fetch: "get",
    search: "get"
};
// The default actions available.
const availableActions = ["create", "update", "del", "fetch", "search"];
/**
 * Get the request body for a given API action.
 */
const getRequestBody = ({ resource, transformOut, actionName, contentType }) => {
    const resourceToSend = transformOut(Object.assign({}, resource));
    if (actionName === "create") {
        delete resourceToSend.id;
    }
    return createRequestBody(contentType, resourceToSend);
};
const getContentType = (options) => {
    return options && options.contentType ? options.contentType : "application/json";
};
/**
 * Get the request headers for a given API action. These include the content type
 * and any necessary authorisation tokens.
 *
 * @param {string} method
 * @param {IAPIOptions} options
 * @param selectAuthToken
 */
const getRequestHeaders = (method, contentType, authToken) => {
    const headers = new Headers();
    if ((method === "post" || method === "put") && contentType !== "multipart/form-data") {
        headers.append("content-type", contentType);
    }
    // Add the authentication code to the header, if we have it
    if (authToken) {
        headers.append("authorization", `Bearer ${authToken}`);
    }
    return headers;
};
/**
 * Creates a request body given a content type.
 *
 * @param {string} contentType e.g. application/json
 * @param {any} resource The resource to send.
 * @return {any} The request body data
 */
const createRequestBody = (contentType, resource) => {
    switch (contentType) {
        case "application/json":
            return JSON.stringify(resource);
        case "multipart/form-data":
            const formData = new FormData();
            for (const name in resource) {
                formData.append(name, resource[name]);
            }
            return formData;
        default:
            throw new Error(`Could not create request body: there is no handler for content-type: ${contentType}`);
    }
};
/**
 * Get the request options for the API action.
 */
const getRequestOptions = ({ method, contentType, authToken, resource, transformOut, actionName }) => {
    const requestOptions = {
        method: method.toUpperCase(),
        headers: getRequestHeaders(method, contentType, authToken)
    };
    if (method === "post" || method === "put") {
        requestOptions.body = getRequestBody({ resource, transformOut, actionName, contentType });
    }
    return requestOptions;
};
/**
 * Get the relative request string for a given API action.
 *
 * @param {string} method
 * @param {string} actionName
 * @param {any} resource
 * @param {string} resourceName
 * @param {IAPIActionOptions} options
 */
const getRequestString = ({ method, actionName, resource, resourceName, options }) => {
    let requestString = "";
    if (options && options.endpoint) {
        requestString += `/${options.endpoint}`;
    }
    else {
        requestString = `/${kebabCase(resourceName)}`;
    }
    // If we have a specific resource or request type, append it to request URL
    if ((method === "get" && actionName !== "search" && resource.id) ||
        method === "delete" ||
        method === "put") {
        requestString += `/${resource.id}`;
    }
    if (actionName === "search") {
        requestString += `/search?${qs.stringify(resource)}`;
    }
    return requestString;
};
/**
 * Get data from the API response.
 */
function getDataFromAPIResponse({ response, resource, actionName, transformIn }) {
    return __awaiter(this, void 0, void 0, function* () {
        if (response.status < 200 || response.status > 299) {
            throw new Error(`HTTP Error: ${response.status}`);
        }
        let data;
        if (actionName === "del") {
            data = resource;
        }
        else {
            // We take the data from the 'data' envelope, if it exists,
            // or from the json directly if it doesn't.
            // It'd be good to let the user provide an envelope.
            const json = yield response.json();
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
        return data;
    });
}
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
     */
    return (payload) => (dispatch, getState) => __awaiter(this, void 0, void 0, function* () {
        // We store a client id here for optimistic creation
        let resource;
        let options;
        let cid;
        let authToken;
        const state = getState();
        const relationKeys = {};
        const crudAction = mapActionToCRUDAction[actionName];
        if (payload) {
            ({ resource, options } = payload);
        }
        if (selectAuthToken) {
            authToken = selectAuthToken(state);
        }
        let localResource = Object.assign({}, resource);
        // If we're creating a record, give it the client id if it doesn't have one already
        if (actionName === "create") {
            cid = localResource.id ? localResource.id : (localResource.id = v4());
        }
        // If we're updating a model, merge it with what's current in the state
        if (actionName === "update") {
            const modelFromState = selectors.findById(state, localResource.id);
            if (!modelFromState) {
                throw new Error(`Could not select model with id ${resource.id}`);
            }
            localResource = Object.assign({}, modelFromState, localResource);
        }
        // Dispatch our start action, if there is one for the given action
        if (resource && actionCreators[crudAction + "Start"]) {
            if (relations && (actionName === "update" || actionName === "create")) {
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
                        actions.push(relations.map[i][crudAction + "Start"](relationData[id]));
                    });
                    dispatch(reduxBatchedActions.batchActions(actions));
                }
            }
            else {
                dispatch(actionCreators[crudAction + "Start"](localResource));
            }
        }
        const contentType = getContentType(options);
        const requestOptions = getRequestOptions({
            resource: localResource,
            actionName,
            method,
            contentType,
            authToken,
            transformOut
        });
        const requestString = getRequestString({
            resource: localResource,
            actionName,
            method,
            resourceName,
            options
        });
        // Make the request and handle the response
        try {
            const response = yield fetch(baseUrl + requestString, requestOptions);
            const data = yield getDataFromAPIResponse({
                resource: localResource,
                response,
                actionName,
                transformIn
            });
            // If there aren't any relations or we're not running a fetch or update, do a basic persist
            if (!relations || (crudAction !== "fetch" && crudAction !== "update")) {
                if (actionName === "create") {
                    dispatch(actionCreators[crudAction + "Success"](data, cid));
                }
                else {
                    dispatch(actionCreators[crudAction + "Success"](data));
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
                        if (crudAction === "fetch") {
                            actions.push(relations.map[i][crudAction + "Success"](relationData[id]));
                        }
                        else {
                            // We use the previously stored cid to reconcile updates here.
                            // It's imperative that relations come back in the same order they went out!
                            actions.push(relations.map[i][crudAction + "Success"](relationData[id], relationKeys[i] ? relationKeys[i][index] : null));
                        }
                    });
                    dispatch(reduxBatchedActions.batchActions(actions));
                }
            }
            // Once we're done, call resolve for the Promise caller
            return data;
        }
        catch (e) {
            if (method === "get") {
                dispatch(actionCreators[crudAction + "Error"](e.message));
            }
            else {
                // Methods that persist data require the resource to revert optimistic updates
                dispatch(actionCreators[crudAction + "Error"](e.message, localResource));
            }
            throw e;
        }
    });
}
// Selectors
// ---------
/**
 * Create selectors for the given resource namespace.
 *
 * @param {string} mountPoint - The name of the resource as appears in the state
 * @return {any} Object with selector methods
 */
function createSelectors(mountPoint) {
    const getLocalState = (state) => state[mountPoint];
    return {
        /**
         * @inheritdocs
         */
        findById(state, id) {
            return getLocalState(state).records[id] || null;
        },
        /**
         * @inheritdocs
         */
        findByCid(state, cid) {
            return find(getLocalState(state).records, (item) => item._cid === cid);
        },
        /**
         * @inheritdocs
         */
        filter(state, predicate) {
            return filter(getLocalState(state).records, predicate);
        },
        orderBy(state, iteratees, order) {
            return orderBy(getLocalState(state).records, iteratees, order);
        },
        /**
         * @inheritdocs
         */
        findAll(state) {
            return getLocalState(state).records;
        },
        isResourceBusy(state, id) {
            const records = getLocalState(state).records;
            return Object.keys(records).some(id => !!records[id].busy);
        },
        isBusy(state, id) {
            const record = getLocalState(state).records[id];
            return record ? !!record.busy : false;
        },
        isPendingUpdate(state, id) {
            const record = getLocalState(state).records[id];
            return record ? !!record.pendingUpdate : false;
        },
        isPendingCreate(state, id) {
            const record = getLocalState(state).records[id];
            return record ? !!record.pendingCreate : false;
        },
        lastFetch(state) {
            return getLocalState(state).lastFetch;
        }
    };
}
const initialState = {
    records: {},
    lastFetch: null
};
/**
 * Create the reduce for the given resource.
 */
const createReducer = (resourceName) => {
    const recordReducer = reduxCrud.Map.reducersFor(resourceName);
    return (state = initialState, action) => {
        const newState = Object.assign({}, state, { records: recordReducer(state.records, action) });
        if (action.type.indexOf("SUCCESS") !== -1 && action.time) {
            newState.lastFetch = action.time;
        }
        return newState;
    };
};
/**
 * Create the action creators for the given resource.
 *
 * We augment some of the default 'success' action creators here to include a time property,
 * which lets the reducer store staleness information.
 */
const createActionCreators = (resourceName) => {
    const rawActionCreators = reduxCrud.actionCreatorsFor(resourceName);
    const actionCreators = Object.assign({}, rawActionCreators);
    actionCreators.fetchSuccess = (records, data) => {
        return Object.assign({}, rawActionCreators.fetchSuccess(records, data), { time: Date.now() });
    };
    actionCreators.updateSuccess = (records, data) => {
        return Object.assign({}, rawActionCreators.updateSuccess(records, data), { time: Date.now() });
    };
    actionCreators.createSuccess = (records, data) => {
        return Object.assign({}, rawActionCreators.createSuccess(records, data), { time: Date.now() });
    };
    return actionCreators;
};
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
    transformOut: identity
} }) {
    const actionCreators = createActionCreators(resourceName);
    const selectors = createSelectors(resourceName);
    const actionNames = reduxCrud.actionTypesFor(resourceName);
    const apiResource = {
        thunks: {},
        actions: actionCreators,
        actionNames: {},
        selectors,
        reducers: createReducer(resourceName)
    };
    // Create a resource for each of our actions
    actions.forEach(actionName => {
        if (!mapActionToHTTPMethod[actionName]) {
            throw new Error(`Method ${actionName} not supported for resource ${resourceName}`);
        }
        // If we've got relations, add the root relation to the relations map.
        // This saves us doing it for every persist operation, and lets us iterate
        // over the whole resource with the relations map.
        if (relations) {
            relations.map[resourceName] = actionCreators;
        }
        apiResource.actionNames = actionNames;
        // Create the worker saga
        apiResource.thunks[actionName] = createAPIAction({
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
    });
    return apiResource;
}

return createAPIResource;

})));
//# sourceMappingURL=redux-crud-api.umd.js.map
