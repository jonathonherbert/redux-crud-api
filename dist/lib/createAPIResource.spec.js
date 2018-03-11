"use strict";
var __assign = (this && this.__assign) || Object.assign || function(t) {
    for (var s, i = 1, n = arguments.length; i < n; i++) {
        s = arguments[i];
        for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
            t[p] = s[p];
    }
    return t;
};
Object.defineProperty(exports, "__esModule", { value: true });
var noop_1 = require("lodash/noop");
var normalizr_1 = require("normalizr");
var qs = require("querystring");
var redux_batched_actions_1 = require("redux-batched-actions");
var redux_crud_1 = require("redux-crud");
var redux_saga_1 = require("redux-saga");
var effects_1 = require("redux-saga/effects");
require("whatwg-fetch");
var createAPIResource_1 = require("./createAPIResource");
var modelResource;
var modelResourceWithTransforms;
var relationResource;
var actionTypes;
var actionCreators;
var relationActionCreators;
var baseUrl = '/api';
var resourceName = 'model';
var errorMessage = 'HTTP Error: 400';
var resource = {
    id: 1,
    exampleData: 'exampleData',
    exampleJson: '{"key":"value"}',
    relations: [{
            id: 1,
            name: 'relation1'
        }, {
            id: 2,
            name: 'relation2'
        }]
};
var state = (_a = {},
    _a[resourceName] = {
        1: {
            id: 1,
            name: 'example1'
        },
        2: {
            id: 2,
            name: 'example2'
        },
        3: {
            id: 3,
            name: 'example3'
        },
        4: {
            id: 4,
            _cid: 'exampleCid',
            name: 'clientGeneratedExample4'
        }
    },
    _a);
var response = {
    status: 200,
    json: function () { return ({
        data: resource
    }); }
};
var arrayResponse = {
    status: 200,
    json: function () { return ({
        data: [resource]
    }); }
};
var responseNoEnvelope = {
    status: 200,
    json: function () { return [resource]; }
};
var invalidAPIResponse = {
    status: 400
};
var transformOut = function (localResource) {
    return __assign({}, localResource, { exampleJson: JSON.stringify(localResource.exampleJson) });
};
var transformIn = function (localResource) {
    return __assign({}, localResource, { exampleJson: JSON.parse(localResource.exampleJson) });
};
var relationSchema = new normalizr_1.schema.Entity('relation');
var modelSchema = new normalizr_1.schema.Entity('model', {
    relations: [relationSchema]
});
var normalisedModelData = normalizr_1.normalize(resource, modelSchema);
// Unnormalised data
modelResource = createAPIResource_1.default({ resourceName: resourceName, baseUrl: baseUrl });
modelResourceWithTransforms = createAPIResource_1.default({ resourceName: resourceName, baseUrl: baseUrl, options: { transformIn: transformIn, transformOut: transformOut } });
actionTypes = redux_crud_1.default.actionTypesFor(resourceName);
actionCreators = redux_crud_1.default.actionCreatorsFor(resourceName);
// Normalised data
relationActionCreators = redux_crud_1.default.actionCreatorsFor(resourceName);
relationResource = createAPIResource_1.default({
    resourceName: resourceName,
    baseUrl: baseUrl,
    relations: {
        schema: modelSchema,
        map: { relation: relationActionCreators }
    }
});
describe('(Util) asyncActionCreator', function () {
    it('creates a create action name and action', function () {
        expect(modelResource.actions.create({ resource: { id: 1 } })).toEqual({
            type: modelResource.actionNames.create,
            payload: {
                resource: { id: 1 }
            },
            meta: {
                resolve: noop_1.default,
                reject: noop_1.default
            }
        });
    });
    it('creates a fetch action name and action', function () {
        expect(modelResource.actions.fetch({ resource: { id: 1 } })).toEqual({
            type: modelResource.actionNames.fetch,
            payload: {
                resource: { id: 1 }
            },
            meta: {
                resolve: noop_1.default,
                reject: noop_1.default
            }
        });
    });
    it('creates an update action name and action', function () {
        expect(modelResource.actions.update({ resource: { id: 1 } })).toEqual({
            type: modelResource.actionNames.update,
            payload: {
                resource: { id: 1 }
            },
            meta: {
                resolve: noop_1.default,
                reject: noop_1.default
            }
        });
    });
    it('creates a delete action name and action', function () {
        expect(modelResource.actions.del({ resource: { id: 1 } })).toEqual({
            type: modelResource.actionNames.del,
            payload: {
                resource: { id: 1 }
            },
            meta: {
                resolve: noop_1.default,
                reject: noop_1.default
            }
        });
    });
    it('creates a search action name and action', function () {
        expect(modelResource.actions.search({ resource: { id: 1 } })).toEqual({
            type: modelResource.actionNames.search,
            payload: {
                resource: { id: 1 }
            },
            meta: {
                resolve: noop_1.default,
                reject: noop_1.default
            }
        });
    });
    it('creates a create watcher saga', function () {
        var iterator = modelResource.sagas.create();
        var expectedYield = effects_1.call(redux_saga_1.takeLatest, modelResource.actionNames.create, modelResource.workers.create);
        expect(iterator.next().value).toEqual(expectedYield);
    });
    it('creates a fetch watcher saga', function () {
        var iterator = modelResource.sagas.fetch();
        var expectedYield = effects_1.call(redux_saga_1.takeLatest, modelResource.actionNames.fetch, modelResource.workers.fetch);
        expect(iterator.next().value).toEqual(expectedYield);
    });
    it('creates an update watcher saga', function () {
        var iterator = modelResource.sagas.update();
        var expectedYield = effects_1.call(redux_saga_1.takeLatest, modelResource.actionNames.update, modelResource.workers.update);
        expect(iterator.next().value).toEqual(expectedYield);
    });
    it('creates a delete watcher saga', function () {
        var iterator = modelResource.sagas.del();
        var expectedYield = effects_1.call(redux_saga_1.takeLatest, modelResource.actionNames.del, modelResource.workers.del);
        expect(iterator.next().value).toEqual(expectedYield);
    });
    it('creates a search watcher saga', function () {
        var iterator = modelResource.sagas.search();
        var expectedYield = effects_1.call(redux_saga_1.takeLatest, modelResource.actionNames.search, modelResource.workers.search);
        expect(iterator.next().value).toEqual(expectedYield);
    });
    describe('Selectors', function () {
        it('should have a selector that fetches models by id', function () {
            expect(modelResource.selectors.findById(state, 1)).toEqual(state[resourceName][1]);
        });
        it('should have a selector that fetches models by cid', function () {
            expect(modelResource.selectors.findByCid(state, 'exampleCid')).toEqual(state[resourceName][4]);
        });
        it('should have a selector that filters by predicate', function () {
            expect(modelResource.selectors.filter(state, function (item) { return item.id > 2; }).length).toBe(2);
            expect(modelResource.selectors.filter(state, function (item) { return item.name.includes('example'); }).length).toBe(3);
        });
        it('should have a selector that returns all of the things', function () {
            expect(modelResource.selectors.findAll(state)).toEqual(state[resourceName]);
        });
    });
    describe('Fetch worker', function () {
        it('makes fetch requests and handles valid array responses', function () {
            var iterator = modelResource.workers.fetch(modelResource.actions.fetch({ resource: resource }));
            // The first yield dispatches the start action.
            expect(iterator.next().value).toEqual(effects_1.put(actionCreators.fetchStart(resource)));
            // Use fetch to make the API call
            expect(iterator.next().value).toEqual(effects_1.call(fetch, '/api/model/1', { method: 'GET', headers: new Headers() }));
            // Deal with the promise returned by the fetch .json() call
            expect(iterator.next(arrayResponse).value).toEqual(effects_1.apply(arrayResponse, arrayResponse.json));
            // Dispatch the success action
            expect(iterator.next(arrayResponse.json()).value)
                .toEqual(effects_1.put(actionCreators.fetchSuccess(arrayResponse.json().data)));
            // Resolve the caller Promise via the action meta
            expect(iterator.next().value).toEqual(effects_1.call(noop_1.default, arrayResponse.json().data));
        });
        it('makes fetch requests and applies transforms', function () {
            var iterator = modelResourceWithTransforms.workers.fetch(modelResourceWithTransforms.actions.fetch({ resource: resource }));
            // The first yield dispatches the start action.
            expect(iterator.next().value).toEqual(effects_1.put(actionCreators.fetchStart(resource)));
            // Use fetch to make the API call
            expect(iterator.next().value).toEqual(effects_1.call(fetch, '/api/model/1', { method: 'GET', headers: new Headers() }));
            // Deal with the promise returned by the fetch .json() call
            expect(iterator.next(arrayResponse).value).toEqual(effects_1.apply(arrayResponse, arrayResponse.json));
            // Dispatch the success action, which should apply the transformation to the incoming data
            expect(iterator.next(arrayResponse.json()).value)
                .toEqual(effects_1.put(actionCreators.fetchSuccess(arrayResponse.json().data.map(function (data) { return transformIn(data); }))));
            // Resolve the caller Promise via the action meta, which should also return transformed data
            expect(iterator.next().value).toEqual(effects_1.call(noop_1.default, arrayResponse.json().data.map(function (data) { return transformIn(data); })));
        });
        it('makes fetch requests and handles responses without an envelope', function () {
            var iterator = modelResource.workers.fetch(modelResource.actions.fetch({ resource: resource }));
            expect(iterator.next().value).toEqual(effects_1.put(actionCreators.fetchStart(resource)));
            expect(iterator.next().value).toEqual(effects_1.call(fetch, '/api/model/1', { method: 'GET', headers: new Headers() }));
            expect(iterator.next(responseNoEnvelope).value).toEqual(effects_1.apply(responseNoEnvelope, responseNoEnvelope.json));
            expect(iterator.next(responseNoEnvelope.json()).value)
                .toEqual(effects_1.put(actionCreators.fetchSuccess(responseNoEnvelope.json())));
            expect(iterator.next().value).toEqual(effects_1.call(noop_1.default, responseNoEnvelope.json()));
        });
        it('makes fetch requests and makes appropriate calls if relations are defined', function () {
            var iterator = relationResource.workers.fetch(relationResource.actions.fetch({ resource: resource }));
            expect(iterator.next().value).toEqual(effects_1.put(actionCreators.fetchStart(resource)));
            expect(iterator.next().value).toEqual(effects_1.call(fetch, '/api/model/1', { method: 'GET', headers: new Headers() }));
            expect(iterator.next(response).value).toEqual(effects_1.apply(response, response.json));
            // The first dispatched action should be the normalised relation data
            expect(iterator.next(response.json()).value)
                .toEqual(effects_1.put(redux_batched_actions_1.batchActions([
                actionCreators.fetchSuccess(normalisedModelData.entities.relation[1]),
                actionCreators.fetchSuccess(normalisedModelData.entities.relation[2])
            ])));
            // And the next should be the normalised model data
            expect(iterator.next().value)
                .toEqual(effects_1.put(redux_batched_actions_1.batchActions([actionCreators.fetchSuccess(normalisedModelData.entities.model[1])])));
            expect(iterator.next().value).toEqual(effects_1.call(noop_1.default, response.json().data));
        });
        it('makes fetch requests and handles errors', function () {
            var iterator = modelResource.workers.fetch(modelResource.actions.fetch({ resource: resource }));
            expect(iterator.next().value).toEqual(effects_1.put(actionCreators.fetchStart(resource)));
            expect(iterator.next().value).toEqual(effects_1.call(fetch, '/api/model/1', { method: 'GET', headers: new Headers() }));
            expect(iterator.next(invalidAPIResponse).value).toEqual(effects_1.put(actionCreators.fetchError(errorMessage)));
            expect(iterator.next().value).toEqual(effects_1.call(noop_1.default, errorMessage));
        });
        it('makes requests with bearer auth if a selector is supplied', function () {
            var selectAuthToken = function () { return 'token'; };
            var modelResourceWithAuth = createAPIResource_1.default({
                resourceName: resourceName,
                baseUrl: baseUrl,
                selectAuthToken: selectAuthToken
            });
            var iterator = modelResourceWithAuth.workers.fetch(modelResource.actions.fetch({ resource: resource }));
            expect(iterator.next().value).toEqual(effects_1.select(selectAuthToken));
            expect(iterator.next('token').value).toEqual(effects_1.put(actionCreators.fetchStart(resource)));
            expect(iterator.next().value).toEqual(effects_1.call(fetch, '/api/model/1', {
                method: 'GET',
                headers: new Headers({
                    Authorization: 'Bearer token'
                })
            }));
            expect(iterator.next(arrayResponse).value).toEqual(effects_1.apply(arrayResponse, arrayResponse.json));
            expect(iterator.next(arrayResponse.json()).value)
                .toEqual(effects_1.put(actionCreators.fetchSuccess(arrayResponse.json().data)));
        });
        it('makes fetch requests to arbitrary endpoints', function () {
            var iterator = modelResource.workers.fetch(modelResource.actions.fetch({ resource: null, options: { endpoint: 'recent' } }));
            // Use fetch to make the API call
            expect(iterator.next().value)
                .toEqual(effects_1.call(fetch, '/api/recent', { method: 'GET', headers: new Headers() }));
            // Deal with the promise returned by the fetch .json() call
            expect(iterator.next(arrayResponse).value).toEqual(effects_1.apply(arrayResponse, arrayResponse.json));
            // Dispatch the success action
            expect(iterator.next(arrayResponse.json()).value)
                .toEqual(effects_1.put(actionCreators.fetchSuccess(arrayResponse.json().data)));
            // Resolve the caller Promise via the action meta
            expect(iterator.next().value).toEqual(effects_1.call(noop_1.default, arrayResponse.json().data));
        });
    });
    describe('Update worker', function () {
        it('makes update requests and handles valid responses', function () {
            var iterator = modelResource.workers.update(modelResource.actions.update({ resource: resource }));
            expect(iterator.next().value).toEqual(effects_1.select(modelResource.selectors.findById, resource.id));
            expect(iterator.next(resource).value).toEqual(effects_1.put(actionCreators.updateStart(resource)));
            var headers = new Headers();
            headers.append('content-type', 'application/json');
            expect(iterator.next().value).toEqual(effects_1.call(fetch, '/api/model/1', {
                method: 'PUT',
                body: JSON.stringify(resource),
                headers: headers
            }));
            expect(iterator.next(response).value).toEqual(effects_1.apply(response, response.json));
            expect(iterator.next(response.json()).value).toEqual(effects_1.put(actionCreators.updateSuccess(response.json().data)));
            expect(iterator.next().value).toEqual(effects_1.call(noop_1.default, response.json().data));
        });
        it('makes update requests and merges existing model with updates', function () {
            var resourceFromState = __assign({}, resource, { isMerged: true });
            var iterator = modelResource.workers.update(modelResource.actions.update({ resource: resource }));
            expect(iterator.next().value).toEqual(effects_1.select(modelResource.selectors.findById, resource.id));
            expect(iterator.next(resourceFromState).value).toEqual(effects_1.put(actionCreators.updateStart(resourceFromState)));
            var headers = new Headers();
            headers.append('content-type', 'application/json');
            expect(iterator.next().value).toEqual(effects_1.call(fetch, '/api/model/1', {
                method: 'PUT',
                body: JSON.stringify(resourceFromState),
                headers: headers
            }));
        });
        it('should throw if the model being updated cannot be found in the local state	', function () {
            var iterator = modelResource.workers.update(modelResource.actions.update({ resource: resource }));
            expect(iterator.next().value).toEqual(effects_1.select(modelResource.selectors.findById, resource.id));
            expect(iterator.next(null).value).toEqual(effects_1.call(noop_1.default, "Could not select model with id " + resource.id));
        });
        it('makes update requests and apply transformations', function () {
            var iterator = modelResourceWithTransforms.workers.update(modelResourceWithTransforms.actions.update({ resource: resource }));
            expect(iterator.next().value).toEqual(effects_1.select(modelResourceWithTransforms.selectors.findById, resource.id));
            expect(iterator.next(resource).value).toEqual(effects_1.put(actionCreators.updateStart(resource)));
            var headers = new Headers();
            headers.append('content-type', 'application/json');
            // The data going to the endpoint should have been run through the transform function
            expect(iterator.next().value).toEqual(effects_1.call(fetch, '/api/model/1', {
                method: 'PUT',
                body: JSON.stringify(transformOut(resource)),
                headers: headers
            }));
        });
        it('makes update requests and applies relations on optimistic update', function () {
            var iterator = relationResource.workers.update(relationResource.actions.update({ resource: resource }));
            // We expect the resource to update the relations and the model optimistically
            expect(iterator.next().value).toEqual(effects_1.select(relationResource.selectors.findById, resource.id));
            expect(iterator.next(resource).value).toEqual(effects_1.put(redux_batched_actions_1.batchActions([
                relationActionCreators.updateStart(normalisedModelData.entities.relation[1]),
                relationActionCreators.updateStart(normalisedModelData.entities.relation[2])
            ])));
            expect(iterator.next(resource).value).toEqual(effects_1.put(redux_batched_actions_1.batchActions([
                actionCreators.updateStart(normalisedModelData.entities.model[1])
            ])));
            var headers = new Headers();
            headers.append('content-type', 'application/json');
            // The data going to the endpoint should have been run through the transform function
            expect(iterator.next().value).toEqual(effects_1.call(fetch, '/api/model/1', {
                method: 'PUT',
                body: JSON.stringify(resource),
                headers: headers
            }));
            expect(iterator.next(response).value).toEqual(effects_1.apply(response, response.json));
            expect(iterator.next(response.json()).value).toEqual(effects_1.put(redux_batched_actions_1.batchActions([
                actionCreators.updateSuccess(normalisedModelData.entities.relation[1], '1'),
                actionCreators.updateSuccess(normalisedModelData.entities.relation[2], '2')
            ])));
            expect(iterator.next().value).toEqual(effects_1.put(redux_batched_actions_1.batchActions([
                actionCreators.updateSuccess(normalisedModelData.entities.model[1], '1')
            ])));
            expect(iterator.next().value).toEqual(effects_1.call(noop_1.default, response.json().data));
        });
        it('makes update requests and handles errors', function () {
            var iterator = modelResource.workers.update(modelResource.actions.update({ resource: resource }));
            expect(iterator.next().value).toEqual(effects_1.select(modelResource.selectors.findById, resource.id));
            expect(iterator.next(resource).value).toEqual(effects_1.put(actionCreators.updateStart(resource)));
            var headers = new Headers();
            headers.append('content-type', 'application/json');
            expect(iterator.next().value).toEqual(effects_1.call(fetch, '/api/model/1', {
                method: 'PUT',
                body: JSON.stringify(resource),
                headers: headers
            }));
            expect(iterator.next(invalidAPIResponse).value).toEqual(effects_1.put(actionCreators.updateError(errorMessage, resource)));
            expect(iterator.next().value).toEqual(effects_1.call(noop_1.default, errorMessage));
        });
    });
    describe('Create worker', function () {
        it('makes create requests and handles valid responses', function () {
            var iterator = modelResource.workers.create(modelResource.actions.create({ resource: __assign({}, resource, { id: 'cid' }) }));
            expect(iterator.next().value).toEqual(effects_1.put(actionCreators.createStart(__assign({}, resource, { id: 'cid' }))));
            var headers = new Headers();
            headers.append('content-type', 'application/json');
            var bodyContent = Object.assign({}, resource);
            delete bodyContent.id;
            expect(iterator.next().value).toEqual(effects_1.call(fetch, '/api/model', {
                method: 'POST',
                body: JSON.stringify(bodyContent),
                headers: headers
            }));
            expect(iterator.next(response).value).toEqual(effects_1.apply(response, response.json));
            expect(iterator.next(response.json()).value).toEqual(effects_1.put(actionCreators.createSuccess(resource, 'cid')));
            expect(iterator.next().value).toEqual(effects_1.call(noop_1.default, response.json().data));
        });
        it('makes create requests and handles errors', function () {
            var iterator = modelResource.workers.create(modelResource.actions.create({ resource: __assign({}, resource, { id: 'cid' }) }));
            expect(iterator.next().value).toEqual(effects_1.put(actionCreators.createStart(__assign({}, resource, { id: 'cid' }))));
            var headers = new Headers();
            headers.append('content-type', 'application/json');
            var bodyContent = Object.assign({}, resource);
            delete bodyContent.id;
            expect(iterator.next().value).toEqual(effects_1.call(fetch, '/api/model', {
                method: 'POST',
                body: JSON.stringify(bodyContent),
                headers: headers
            }));
            expect(iterator.next(invalidAPIResponse).value).toEqual(effects_1.put(actionCreators.createError(errorMessage, __assign({}, resource, { id: 'cid' }))));
            expect(iterator.next().value).toEqual(effects_1.call(noop_1.default, errorMessage));
        });
    });
    describe('Delete worker', function () {
        it('Creates delete requests and handles valid responses', function () {
            var iterator = modelResource.workers.del(modelResource.actions.del({ resource: resource }));
            expect(iterator.next().value).toEqual(effects_1.put(actionCreators.deleteStart(resource)));
            expect(iterator.next().value)
                .toEqual(effects_1.call(fetch, '/api/model/1', { method: 'DELETE', headers: new Headers() }));
            expect(iterator.next({ status: 200 }).value).toEqual(effects_1.put(actionCreators.deleteSuccess(resource)));
            expect(iterator.next().value).toEqual(effects_1.call(noop_1.default, resource));
        });
        it('Creates delete requests and handles errors', function () {
            var iterator = modelResource.workers.del(modelResource.actions.del({ resource: resource }));
            expect(iterator.next().value).toEqual(effects_1.put(actionCreators.deleteStart(resource)));
            expect(iterator.next().value)
                .toEqual(effects_1.call(fetch, '/api/model/1', { method: 'DELETE', headers: new Headers() }));
            expect(iterator.next({ status: 400 }).value).toEqual(effects_1.put(actionCreators.deleteError(errorMessage, resource)));
            expect(iterator.next().value).toEqual(effects_1.call(noop_1.default, errorMessage));
        });
        it('Creates delete requests and doesn\'t apply transforms to local data', function () {
            var iterator = modelResourceWithTransforms.workers.del(modelResourceWithTransforms.actions.del({ resource: resource }));
            expect(iterator.next().value).toEqual(effects_1.put(actionCreators.deleteStart(resource)));
            expect(iterator.next().value)
                .toEqual(effects_1.call(fetch, '/api/model/1', { method: 'DELETE', headers: new Headers() }));
            expect(iterator.next({ status: 200 }).value).toEqual(effects_1.put(actionCreators.deleteSuccess(resource)));
            expect(iterator.next().value).toEqual(effects_1.call(noop_1.default, resource));
        });
    });
    describe('Search worker', function () {
        it('Creates search requests and handles valid responses', function () {
            var searchParams = {
                dateFrom: '01/12/2016',
                dateTo: '02/12/2016'
            };
            var searchResponse = {
                status: 200,
                json: function () { return ({
                    data: [{
                            id: 1,
                            exampleData: 'exampleData'
                        }]
                }); }
            };
            var iterator = modelResource.workers.search(modelResource.actions.search({ resource: searchParams }));
            expect(iterator.next().value).toEqual(effects_1.put(actionCreators.fetchStart(searchParams)));
            expect(iterator.next().value).toEqual(effects_1.call(fetch, '/api/model/search?' + qs.stringify(searchParams), {
                method: 'GET',
                headers: new Headers()
            }));
            expect(iterator.next(searchResponse).value).toEqual(effects_1.apply(searchResponse, searchResponse.json));
            expect(iterator.next(searchResponse.json()).value)
                .toEqual(effects_1.put(actionCreators.fetchSuccess(searchResponse.json().data)));
            expect(iterator.next().value).toEqual(effects_1.call(noop_1.default, searchResponse.json().data));
        });
        it('Creates search requests and normalises responses', function () {
            var searchParams = {
                dateFrom: '01/12/2016',
                dateTo: '02/12/2016'
            };
            var iterator = relationResource.workers.search(modelResource.actions.search({ resource: searchParams }));
            expect(iterator.next().value).toEqual(effects_1.put(actionCreators.fetchStart(searchParams)));
            expect(iterator.next().value).toEqual(effects_1.call(fetch, '/api/model/search?' + qs.stringify(searchParams), {
                method: 'GET',
                headers: new Headers()
            }));
            expect(iterator.next(response).value).toEqual(effects_1.apply(response, response.json));
            // The first dispatched action should be the normalised relation data
            expect(iterator.next(response.json()).value)
                .toEqual(effects_1.put(redux_batched_actions_1.batchActions([
                actionCreators.fetchSuccess(normalisedModelData.entities.relation[1]),
                actionCreators.fetchSuccess(normalisedModelData.entities.relation[2])
            ])));
            // And the next should be the normalised model data
            expect(iterator.next().value)
                .toEqual(effects_1.put(redux_batched_actions_1.batchActions([actionCreators.fetchSuccess(normalisedModelData.entities.model[1])])));
            expect(iterator.next().value).toEqual(effects_1.call(noop_1.default, response.json().data));
        });
        it('Creates search requests and handles errors', function () {
            var searchParams = {
                dateFrom: '01/12/2016',
                dateTo: '02/12/2016'
            };
            var iterator = modelResource.workers.search(modelResource.actions.search({ resource: searchParams }));
            expect(iterator.next().value).toEqual(effects_1.put(actionCreators.fetchStart(searchParams)));
            expect(iterator.next().value).toEqual(effects_1.call(fetch, '/api/model/search?' + qs.stringify(searchParams), {
                method: 'GET',
                headers: new Headers()
            }));
            expect(iterator.next({ status: 400 }).value).toEqual(effects_1.put(actionCreators.fetchError(errorMessage)));
            expect(iterator.next().value).toEqual(effects_1.call(noop_1.default, errorMessage));
        });
    });
});
var _a;
//# sourceMappingURL=createAPIResource.spec.js.map