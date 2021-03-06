import filter from 'lodash/filter';
import find from 'lodash/find';
import identity from 'lodash/identity';
import kebabCase from 'lodash/kebabCase';
import orderBy from 'lodash/orderBy';
import { normalize } from 'normalizr';
import { stringify } from 'querystring';
import { batchActions } from 'redux-batched-actions';
import reduxCrud from 'redux-crud';
import v4 from 'uuid/v4';

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









function __awaiter(thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
}

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

// The names we use for actions don't map to the redux-crud action names, so we do that here.
var mapActionToCRUDAction = {
    create: "create",
    del: "delete",
    fetch: "fetch",
    search: "fetch",
    update: "update"
};
// The names we use for actions also must map to the http methods.
var mapActionToHTTPMethod = {
    create: "post",
    update: "put",
    del: "delete",
    fetch: "get",
    search: "get"
};
// The default actions available.
var availableActions = ["create", "update", "del", "fetch", "search"];
/**
 * Get the request body for a given API action.
 */
var getRequestBody = function (_a) {
    var resource = _a.resource, transformOut = _a.transformOut, actionName = _a.actionName, contentType = _a.contentType;
    var resourceToSend = transformOut(__assign({}, resource));
    if (actionName === "create") {
        delete resourceToSend.id;
    }
    return createRequestBody(contentType, resourceToSend);
};
var getContentType = function (options) {
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
var getRequestHeaders = function (method, contentType, authToken) {
    var headers = new Headers();
    if ((method === "post" || method === "put") && contentType !== "multipart/form-data") {
        headers.append("content-type", contentType);
    }
    // Add the authentication code to the header, if we have it
    if (authToken) {
        headers.append("authorization", "Bearer " + authToken);
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
        case "application/json":
            return JSON.stringify(resource);
        case "multipart/form-data":
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
        headers: getRequestHeaders(method, contentType, authToken)
    };
    if (method === "post" || method === "put") {
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
    var requestString = "";
    if (options && options.endpoint) {
        requestString += "/" + options.endpoint;
    }
    else {
        requestString = "/" + kebabCase(resourceName);
    }
    // If we have a specific resource or request type, append it to request URL
    if ((method === "get" && actionName !== "search" && resource.id) ||
        method === "delete" ||
        method === "put") {
        requestString += "/" + resource.id;
    }
    if (actionName === "search") {
        requestString += "/search?" + stringify(resource);
    }
    return requestString;
};
/**
 * Get data from the API response.
 */
function getDataFromAPIResponse(_a) {
    var response = _a.response, resource = _a.resource, actionName = _a.actionName, transformIn = _a.transformIn;
    return __awaiter(this, void 0, void 0, function () {
        var data, json, dataIsArray;
        return __generator(this, function (_b) {
            switch (_b.label) {
                case 0:
                    if (response.status < 200 || response.status > 299) {
                        throw new Error("HTTP Error: " + response.status);
                    }
                    if (!(actionName === "del")) return [3 /*break*/, 1];
                    data = resource;
                    return [3 /*break*/, 3];
                case 1: return [4 /*yield*/, response.json()];
                case 2:
                    json = _b.sent();
                    data = json.data ? json.data : json;
                    dataIsArray = Array.isArray(data);
                    if (dataIsArray) {
                        data = data.map(function (item) { return transformIn(item); });
                    }
                    else {
                        data = transformIn(data);
                    }
                    _b.label = 3;
                case 3: return [2 /*return*/, data];
            }
        });
    });
}
/**
 * Creates a saga that handles API operations.
 * Updates optimistically when updating or creating.
 *
 * @param {ICreateAPIActionOptions}
 */
function createAPIAction(_a) {
    var _this = this;
    var resourceName = _a.resourceName, baseUrl = _a.baseUrl, actionCreators = _a.actionCreators, actionName = _a.actionName, method = _a.method, selectAuthToken = _a.selectAuthToken, selectors = _a.selectors, relations = _a.relations, transformIn = _a.transformIn, transformOut = _a.transformOut;
    /**
     * Generator for the given action.
     * Accepts FSA containing a payload with property 'resource' containing request data.
     * Dispatches start (if applicable) action, makes HTTP calls, dispatches success/error actions with result.
     */
    return function (payload) { return function (dispatch, getState) { return __awaiter(_this, void 0, void 0, function () {
        var resource, options, cid, authToken, state, relationKeys, crudAction, localResource, modelFromState, schema, normalisedResource, actions_1, _loop_1, i, contentType, requestOptions, requestString, response, data, normalisedData, actions_2, _loop_2, i, e_1;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    state = getState();
                    relationKeys = {};
                    crudAction = mapActionToCRUDAction[actionName];
                    if (payload) {
                        (resource = payload.resource, options = payload.options);
                    }
                    if (selectAuthToken) {
                        authToken = selectAuthToken(state);
                    }
                    localResource = __assign({}, resource);
                    // If we're creating a record, give it the client id if it doesn't have one already
                    if (actionName === "create") {
                        cid = localResource.id ? localResource.id : (localResource.id = v4());
                    }
                    // If we're updating a model, merge it with what's current in the state
                    if (actionName === "update") {
                        modelFromState = selectors.findById(state, localResource.id);
                        if (!modelFromState) {
                            throw new Error("Could not select model with id " + resource.id);
                        }
                        localResource = __assign({}, modelFromState, localResource);
                    }
                    // Dispatch our start action, if there is one for the given action
                    if (resource && actionCreators[crudAction + "Start"]) {
                        if (relations && (actionName === "update" || actionName === "create")) {
                            schema = Array.isArray(localResource) ? [relations.schema] : relations.schema;
                            normalisedResource = normalize(localResource, schema);
                            actions_1 = [];
                            _loop_1 = function (i) {
                                var relationData = normalisedResource.entities[i];
                                if (!relationData) {
                                    return "continue";
                                }
                                // We store relation keys (cids) in order here.
                                // When we receive relation updates at the end of the action,
                                // we can replay these keys in order to sync with optimistic updates.
                                relationKeys[i] = [];
                                if (relationData.undefined) {
                                    console.warn("One or more of the relations you're trying to " + actionName + " is missing an id.\t\t\t\t\t\t\tBad things are likely to happen as a result.");
                                }
                                Object.keys(relationData).forEach(function (id) {
                                    relationKeys[i].push(id);
                                    actions_1.push(relations.map[i][crudAction + "Start"](relationData[id]));
                                });
                            };
                            for (i in relations.map) {
                                _loop_1(i);
                            }
                            dispatch(batchActions(actions_1));
                        }
                        else {
                            dispatch(actionCreators[crudAction + "Start"](localResource));
                        }
                    }
                    contentType = getContentType(options);
                    requestOptions = getRequestOptions({
                        resource: localResource,
                        actionName: actionName,
                        method: method,
                        contentType: contentType,
                        authToken: authToken,
                        transformOut: transformOut
                    });
                    requestString = getRequestString({
                        resource: localResource,
                        actionName: actionName,
                        method: method,
                        resourceName: resourceName,
                        options: options
                    });
                    _a.label = 1;
                case 1:
                    _a.trys.push([1, 4, , 5]);
                    return [4 /*yield*/, fetch(baseUrl + requestString, requestOptions)];
                case 2:
                    response = _a.sent();
                    return [4 /*yield*/, getDataFromAPIResponse({
                            resource: localResource,
                            response: response,
                            actionName: actionName,
                            transformIn: transformIn
                        })];
                case 3:
                    data = _a.sent();
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
                        normalisedData = normalize(data, Array.isArray(data) ? [relations.schema] : relations.schema);
                        actions_2 = [];
                        _loop_2 = function (i) {
                            var relationData = normalisedData.entities[i];
                            if (!relationData) {
                                return "continue";
                            }
                            Object.keys(relationData).forEach(function (id, index) {
                                if (crudAction === "fetch") {
                                    actions_2.push(relations.map[i][crudAction + "Success"](relationData[id]));
                                }
                                else {
                                    // We use the previously stored cid to reconcile updates here.
                                    // It's imperative that relations come back in the same order they went out!
                                    actions_2.push(relations.map[i][crudAction + "Success"](relationData[id], relationKeys[i] ? relationKeys[i][index] : null));
                                }
                            });
                        };
                        for (i in relations.map) {
                            _loop_2(i);
                        }
                        if (!actions_2.length) {
                            // If we haven't received any data, add a single success event.
                            // This will ensure that busy indicators are reset etc., and any
                            // consumer code watching for success actions will fire as expected.
                            actions_2.push(actionCreators[crudAction + "Success"]([]));
                        }
                        dispatch(batchActions(actions_2));
                    }
                    // Once we're done, call resolve for the Promise caller
                    return [2 /*return*/, data];
                case 4:
                    e_1 = _a.sent();
                    if (method === "get") {
                        dispatch(actionCreators[crudAction + "Error"](e_1.message));
                    }
                    else {
                        // Methods that persist data require the resource to revert optimistic updates
                        dispatch(actionCreators[crudAction + "Error"](e_1.message, localResource));
                    }
                    throw e_1;
                case 5: return [2 /*return*/];
            }
        });
    }); }; };
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
    var getLocalState = function (state) { return state[mountPoint]; };
    return {
        /**
         * @inheritdocs
         */
        findById: function (state, id) {
            return getLocalState(state).records[id] || null;
        },
        /**
         * @inheritdocs
         */
        findByCid: function (state, cid) {
            return find(getLocalState(state).records, function (item) { return item._cid === cid; });
        },
        /**
         * @inheritdocs
         */
        filter: function (state, predicate) {
            return filter(getLocalState(state).records, predicate);
        },
        orderBy: function (state, iteratees, order) {
            return orderBy(getLocalState(state).records, iteratees, order);
        },
        /**
         * @inheritdocs
         */
        findAll: function (state) {
            return getLocalState(state).records;
        },
        isResourceBusy: function (state) {
            return getLocalState(state).busy;
        },
        isBusy: function (state, id) {
            var record = getLocalState(state).records[id];
            return record ? !!record.busy : false;
        },
        isPendingUpdate: function (state, id) {
            var record = getLocalState(state).records[id];
            return record ? !!record.pendingUpdate : false;
        },
        isPendingCreate: function (state, id) {
            var record = getLocalState(state).records[id];
            return record ? !!record.pendingCreate : false;
        },
        lastFetch: function (state) {
            return getLocalState(state).lastFetch;
        }
    };
}
var initialState = {
    records: {},
    lastFetch: null,
    busy: false
};
/**
 * Create the reduce for the given resource.
 */
var createReducer = function (resourceName, actionNames) {
    var recordReducer = reduxCrud.Map.reducersFor(resourceName);
    return function (state, action) {
        if (state === void 0) { state = initialState; }
        var newState = __assign({}, state, { records: recordReducer(state.records, action) });
        if (action.type === actionNames.fetchStart ||
            action.type === actionNames.createStart ||
            action.type === actionNames.updateStart ||
            action.type === actionNames.deleteStart) {
            newState.busy = true;
        }
        if (action.type === actionNames.fetchSuccess ||
            action.type === actionNames.createSuccess ||
            action.type === actionNames.updateSuccess ||
            action.type === actionNames.deleteSuccess) {
            // If there are no records that are still busy, mark the resource as unbusy.
            if (!Object.keys(state.records).some(function (id) { return state.records[id] && !!state.records[id].busy; })) {
                newState.busy = false;
            }
            if (action.time) {
                newState.lastFetch = action.time;
            }
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
var createActionCreators = function (resourceName) {
    var rawActionCreators = reduxCrud.actionCreatorsFor(resourceName);
    var actionCreators = __assign({}, rawActionCreators);
    actionCreators.fetchSuccess = function (records, data) {
        return __assign({}, rawActionCreators.fetchSuccess(records, data), { time: Date.now() });
    };
    actionCreators.updateSuccess = function (records, data) {
        return __assign({}, rawActionCreators.updateSuccess(records, data), { time: Date.now() });
    };
    actionCreators.createSuccess = function (records, data) {
        return __assign({}, rawActionCreators.createSuccess(records, data), { time: Date.now() });
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
function createAPIResource(_a) {
    var resourceName = _a.resourceName, baseUrl = _a.baseUrl, _b = _a.actions, actions = _b === void 0 ? availableActions : _b, selectAuthToken = _a.selectAuthToken, relations = _a.relations, _c = _a.options, options = _c === void 0 ? {
        transformIn: identity,
        transformOut: identity
    } : _c;
    var actionCreators = createActionCreators(resourceName);
    var selectors = createSelectors(resourceName);
    var actionNames = reduxCrud.actionTypesFor(resourceName);
    var apiResource = {
        thunks: {},
        actions: actionCreators,
        actionNames: {},
        selectors: selectors,
        reducers: createReducer(resourceName, actionNames)
    };
    // Create a resource for each of our actions
    actions.forEach(function (actionName) {
        if (!mapActionToHTTPMethod[actionName]) {
            throw new Error("Method " + actionName + " not supported for resource " + resourceName);
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
    });
    return apiResource;
}

export default createAPIResource;
//# sourceMappingURL=redux-crud-api.es5.js.map
