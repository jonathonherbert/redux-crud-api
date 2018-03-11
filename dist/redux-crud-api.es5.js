import filter from 'lodash/filter';
import find from 'lodash/find';
import identity from 'lodash/identity';
import kebabCase from 'lodash/kebabCase';
import orderBy from 'lodash/orderBy';
import { normalize } from 'normalizr';
import { stringify } from 'querystring';
import { batchActions } from 'redux-batched-actions';
import reduxCrud from 'redux-crud';
import { takeLatest } from 'redux-saga';
import { apply, call, put, select } from 'redux-saga/effects';
import v4 from 'uuid/v4';
import 'whatwg-fetch';
import noop from 'lodash/noop';
import { createAction } from 'redux-actions';

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



var __assign = Object.assign || function __assign(t) {
    for (var s, i = 1, n = arguments.length; i < n; i++) {
        s = arguments[i];
        for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p)) t[p] = s[p];
    }
    return t;
};











function __generator(thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g;
    return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (_) try {
            if (f = 1, y && (t = y[op[0] & 2 ? "return" : op[0] ? "throw" : "next"]) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [0, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
}

var metaCreator = function (_, resolve, reject) {
    if (resolve === void 0) { resolve = noop; }
    if (reject === void 0) { reject = noop; }
    return ({ resolve: resolve, reject: reject });
};
var createPromiseAction = function (type, payloadCreator) { return createAction(type, payloadCreator, metaCreator); };

// The names we use for actions don't map to the redux-crud action names, so we do that here.
var mapActionToCRUDAction = {
    create: 'create',
    del: 'delete',
    fetch: 'fetch',
    search: 'fetch',
    update: 'update',
};
// The names we use for actions also must map to the http methods.
var mapActionToHTTPMethod = {
    create: 'post',
    update: 'put',
    del: 'delete',
    fetch: 'get',
    search: 'get',
};
// The default actions available.
var availableActions = ['create', 'update', 'del', 'fetch', 'search'];
/**
 * Get the request body for a given API action.
 *
 * @param {string} method
 * @param {IAPIActionOptions} options
 */
var getRequestBody = function (_a) {
    var resource = _a.resource, transformOut = _a.transformOut, actionName = _a.actionName, contentType = _a.contentType;
    var resourceToSend = transformOut(__assign({}, resource));
    if (actionName === 'create') {
        delete resourceToSend.id;
    }
    return createRequestBody(contentType, resourceToSend);
};
var getContentType = function (options) {
    return options && options.contentType ? options.contentType : 'application/json';
};
/**
 * Get the request headers for a given API action. These include the content type
 * and any necessary authorisation tokens.
 *
 * @param {string} method
 * @param {IAPIOptions} options
 * @param selectAuthToken
 */
var getRequestHeaders = function (method, contentType, authToken) {
    var headers = new Headers();
    if ((method === 'post' || method === 'put') && contentType !== 'multipart/form-data') {
        headers.append('content-type', contentType);
    }
    // Add the authentication code to the header, if we have it
    if (authToken) {
        headers.append('Authorization', "Bearer " + authToken);
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
var createRequestBody = function (contentType, resource) {
    switch (contentType) {
        case 'application/json':
            return JSON.stringify(resource);
        case 'multipart/form-data':
            var formData = new FormData();
            for (var name_1 in resource) {
                formData.append(name_1, resource[name_1]);
            }
            return formData;
        default:
            throw new Error("Could not create request body: there is no handler for content-type: " + contentType);
    }
};
/**
 * Get the request options for the API action.
 */
var getRequestOptions = function (_a) {
    var method = _a.method, contentType = _a.contentType, authToken = _a.authToken, resource = _a.resource, transformOut = _a.transformOut, actionName = _a.actionName;
    var requestOptions = {
        method: method.toUpperCase(),
        headers: getRequestHeaders(method, contentType, authToken),
    };
    if (method === 'post' || method === 'put') {
        requestOptions.body = getRequestBody({ resource: resource, transformOut: transformOut, actionName: actionName, contentType: contentType });
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
var getRequestString = function (_a) {
    var method = _a.method, actionName = _a.actionName, resource = _a.resource, resourceName = _a.resourceName, options = _a.options;
    var requestString = '';
    if (options && options.endpoint) {
        requestString += "/" + options.endpoint;
    }
    else {
        requestString = "/" + kebabCase(resourceName);
    }
    // If we have a specific resource or request type, append it to request URL
    if ((method === 'get' && actionName !== 'search' && resource.id) || method === 'delete' || method === 'put') {
        requestString += "/" + resource.id;
    }
    if (actionName === 'search') {
        requestString += "/search?" + stringify(resource);
    }
    return requestString;
};
/**
 * Creates a saga that handles API operations.
 * Updates optimistically when updating or creating.
 *
 * @param {ICreateAPIActionOptions}
 */
function createAPIAction(_a) {
    var resourceName = _a.resourceName, baseUrl = _a.baseUrl, actionCreators = _a.actionCreators, actionName = _a.actionName, method = _a.method, selectAuthToken = _a.selectAuthToken, selectors = _a.selectors, relations = _a.relations, transformIn = _a.transformIn, transformOut = _a.transformOut;
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
    return function (_a) {
        var payload = _a.payload, _b = _a.meta, resolve = _b.resolve, reject = _b.reject;
        var resource, options, cid, authToken, relationKeys, crudAction, localResource, modelFromState, schema, normalisedResource, _loop_1, _c, _d, _i, i, contentType, requestOptions, requestString, response, data, json, dataIsArray, normalisedData, _loop_2, _e, _f, _g, i, e_1;
        return __generator(this, function (_h) {
            switch (_h.label) {
                case 0:
                    relationKeys = {};
                    crudAction = mapActionToCRUDAction[actionName];
                    if (payload) {
                        (resource = payload.resource, options = payload.options);
                    }
                    if (!selectAuthToken) return [3 /*break*/, 2];
                    return [4 /*yield*/, select(selectAuthToken)];
                case 1:
                    authToken = _h.sent();
                    _h.label = 2;
                case 2:
                    localResource = __assign({}, resource);
                    // If we're creating a record, give it the client id if it doesn't have one already
                    if (actionName === 'create') {
                        if (localResource.id) {
                            cid = localResource.id;
                        }
                        else {
                            cid = localResource.id = v4();
                        }
                    }
                    if (!(actionName === 'update')) return [3 /*break*/, 6];
                    return [4 /*yield*/, select(selectors.findById, localResource.id)];
                case 3:
                    modelFromState = _h.sent();
                    if (!!modelFromState) return [3 /*break*/, 5];
                    return [4 /*yield*/, call(reject, "Could not select model with id " + resource.id)];
                case 4:
                    _h.sent();
                    _h.label = 5;
                case 5:
                    localResource = __assign({}, modelFromState, localResource);
                    _h.label = 6;
                case 6:
                    if (!(resource && actionCreators[crudAction + 'Start'])) return [3 /*break*/, 13];
                    if (!(relations && (actionName === 'update' || actionName === 'create'))) return [3 /*break*/, 11];
                    schema = Array.isArray(localResource) ? [relations.schema] : relations.schema;
                    normalisedResource = normalize(localResource, schema);
                    _loop_1 = function (i) {
                        var relationData, actions;
                        return __generator(this, function (_a) {
                            switch (_a.label) {
                                case 0:
                                    relationData = normalisedResource.entities[i];
                                    if (!relationData) {
                                        return [2 /*return*/, "continue"];
                                    }
                                    // We store relation keys (cids) in order here.
                                    // When we receive relation updates at the end of the action,
                                    // we can replay these keys in order to sync with optimistic updates.
                                    relationKeys[i] = [];
                                    actions = [];
                                    if (relationData.undefined) {
                                        console.warn("One or more of the relations you're trying to " + actionName + " is missing an id.\t\t\t\t\t\t\tBad things are likely to happen as a result.");
                                    }
                                    Object.keys(relationData).forEach(function (id) {
                                        relationKeys[i].push(id);
                                        actions.push(relations.map[i][crudAction + 'Start'](relationData[id]));
                                    });
                                    return [4 /*yield*/, put(batchActions(actions))];
                                case 1:
                                    _a.sent();
                                    return [2 /*return*/];
                            }
                        });
                    };
                    _c = [];
                    for (_d in relations.map)
                        _c.push(_d);
                    _i = 0;
                    _h.label = 7;
                case 7:
                    if (!(_i < _c.length)) return [3 /*break*/, 10];
                    i = _c[_i];
                    return [5 /*yield**/, _loop_1(i)];
                case 8:
                    _h.sent();
                    _h.label = 9;
                case 9:
                    _i++;
                    return [3 /*break*/, 7];
                case 10: return [3 /*break*/, 13];
                case 11: return [4 /*yield*/, put(actionCreators[crudAction + 'Start'](localResource))];
                case 12:
                    _h.sent();
                    _h.label = 13;
                case 13:
                    contentType = getContentType(options);
                    requestOptions = getRequestOptions({ resource: localResource, actionName: actionName, method: method, contentType: contentType, authToken: authToken, transformOut: transformOut });
                    requestString = getRequestString({ resource: localResource, actionName: actionName, method: method, resourceName: resourceName, options: options });
                    _h.label = 14;
                case 14:
                    _h.trys.push([14, 29, , 35]);
                    return [4 /*yield*/, call(fetch, baseUrl + requestString, requestOptions)];
                case 15:
                    response = _h.sent();
                    if (response.status < 200 || response.status > 299) {
                        throw new Error("HTTP Error: " + response.status);
                    }
                    data = void 0;
                    if (!(actionName === 'del')) return [3 /*break*/, 16];
                    data = localResource;
                    return [3 /*break*/, 18];
                case 16: return [4 /*yield*/, apply(response, response.json)];
                case 17:
                    json = _h.sent();
                    data = json.data ? json.data : json;
                    dataIsArray = Array.isArray(data);
                    if (dataIsArray) {
                        data = data.map(function (item) { return transformIn(item); });
                    }
                    else {
                        data = transformIn(data);
                    }
                    _h.label = 18;
                case 18:
                    if (!(!relations || (crudAction !== 'fetch' && crudAction !== 'update'))) return [3 /*break*/, 23];
                    if (!(actionName === 'create')) return [3 /*break*/, 20];
                    return [4 /*yield*/, put(actionCreators[crudAction + 'Success'](data, cid))];
                case 19:
                    _h.sent();
                    return [3 /*break*/, 22];
                case 20: return [4 /*yield*/, put(actionCreators[crudAction + 'Success'](data))];
                case 21:
                    _h.sent();
                    _h.label = 22;
                case 22: return [3 /*break*/, 27];
                case 23:
                    normalisedData = normalize(data, Array.isArray(data) ? [relations.schema] : relations.schema);
                    _loop_2 = function (i) {
                        var relationData, actions;
                        return __generator(this, function (_a) {
                            switch (_a.label) {
                                case 0:
                                    relationData = normalisedData.entities[i];
                                    if (!relationData) {
                                        return [2 /*return*/, "continue"];
                                    }
                                    actions = [];
                                    Object.keys(relationData).forEach(function (id, index) {
                                        if (crudAction === 'fetch') {
                                            actions.push(relations.map[i][crudAction + 'Success'](relationData[id]));
                                        }
                                        else {
                                            // We use the previously stored cid to reconcile updates here.
                                            // It's imperative that relations come back in the same order they went out!
                                            actions.push(relations.map[i][crudAction + 'Success'](relationData[id], relationKeys[i] ? relationKeys[i][index] : null));
                                        }
                                    });
                                    return [4 /*yield*/, put(batchActions(actions))];
                                case 1:
                                    _a.sent();
                                    return [2 /*return*/];
                            }
                        });
                    };
                    _e = [];
                    for (_f in relations.map)
                        _e.push(_f);
                    _g = 0;
                    _h.label = 24;
                case 24:
                    if (!(_g < _e.length)) return [3 /*break*/, 27];
                    i = _e[_g];
                    return [5 /*yield**/, _loop_2(i)];
                case 25:
                    _h.sent();
                    _h.label = 26;
                case 26:
                    _g++;
                    return [3 /*break*/, 24];
                case 27: 
                // Once we're done, call resolve for the Promise caller
                return [4 /*yield*/, call(resolve, data)];
                case 28:
                    // Once we're done, call resolve for the Promise caller
                    _h.sent();
                    return [3 /*break*/, 35];
                case 29:
                    e_1 = _h.sent();
                    if (!(method === 'get')) return [3 /*break*/, 31];
                    return [4 /*yield*/, put(actionCreators[crudAction + 'Error'](e_1.message))];
                case 30:
                    _h.sent();
                    return [3 /*break*/, 33];
                case 31: 
                // Methods that persist data require the resource to revert optimistic updates
                return [4 /*yield*/, put(actionCreators[crudAction + 'Error'](e_1.message, localResource))];
                case 32:
                    // Methods that persist data require the resource to revert optimistic updates
                    _h.sent();
                    _h.label = 33;
                case 33: 
                // Call reject for the Promise caller
                return [4 /*yield*/, call(reject, e_1.message)];
                case 34:
                    // Call reject for the Promise caller
                    _h.sent();
                    return [3 /*break*/, 35];
                case 35: return [2 /*return*/];
            }
        });
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
        findById: function (state, id) {
            return state[resourceName][id] || null;
        },
        /**
         * @inheritdocs
         */
        findByCid: function (state, cid) {
            return find(state[resourceName], function (item) { return item._cid === cid; });
        },
        /**
         * @inheritdocs
         */
        filter: function (state, predicate) {
            return filter(state[resourceName], predicate);
        },
        orderBy: function (state, predicate, order) {
            return orderBy(state[resourceName], predicate, order);
        },
        /**
         * @inheritdocs
         */
        findAll: function (state) {
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
function createAPIResource(_a) {
    var resourceName = _a.resourceName, baseUrl = _a.baseUrl, _b = _a.actions, actions = _b === void 0 ? availableActions : _b, selectAuthToken = _a.selectAuthToken, relations = _a.relations, _c = _a.options, options = _c === void 0 ? {
        transformIn: identity,
        transformOut: identity,
    } : _c;
    var actionCreators = reduxCrud.actionCreatorsFor(resourceName);
    var selectors = createSelectors(resourceName);
    var apiResource = {
        workers: {},
        sagas: {},
        actions: actionCreators,
        actionNames: reduxCrud.actionTypesFor(resourceName),
        selectors: selectors,
        reducers: reduxCrud.Map.reducersFor(resourceName)
    };
    // Create a resource for each of our actions
    actions.forEach(function (actionName) {
        if (!mapActionToHTTPMethod[actionName]) {
            throw new Error("Method " + actionName + " not supported for resource " + resourceName);
        }
        // Create the action constant
        apiResource.actionNames[actionName] = resourceName.toUpperCase() + "_" + actionName.toUpperCase();
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
            resourceName: resourceName,
            baseUrl: baseUrl,
            actionCreators: actionCreators,
            selectors: selectors,
            actionName: actionName,
            method: mapActionToHTTPMethod[actionName],
            selectAuthToken: selectAuthToken,
            relations: relations,
            transformIn: options.transformIn || identity,
            transformOut: options.transformOut || identity
        });
        // Create the watcher saga
        apiResource.sagas[actionName] = function () {
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, call(takeLatest, apiResource.actionNames[actionName], apiResource.workers[actionName])];
                    case 1:
                        _a.sent();
                        return [2 /*return*/];
                }
            });
        };
    });
    return apiResource;
}

export default createAPIResource;
//# sourceMappingURL=redux-crud-api.es5.js.map
