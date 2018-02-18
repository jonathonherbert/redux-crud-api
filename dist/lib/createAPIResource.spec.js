"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const noop_1 = require("lodash/noop");
const normalizr_1 = require("normalizr");
const qs = require("querystring");
const redux_batched_actions_1 = require("redux-batched-actions");
const redux_crud_1 = require("redux-crud");
const redux_saga_1 = require("redux-saga");
const effects_1 = require("redux-saga/effects");
require("whatwg-fetch");
const createAPIResource_1 = require("./createAPIResource");
let modelResource;
let modelResourceWithTransforms;
let relationResource;
let actionTypes;
let actionCreators;
let relationActionCreators;
const baseUrl = '/api';
const resourceName = 'model';
const errorMessage = 'HTTP Error: 400';
const resource = {
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
const state = {
    [resourceName]: {
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
    }
};
const response = {
    status: 200,
    json: () => ({
        data: resource
    })
};
const arrayResponse = {
    status: 200,
    json: () => ({
        data: [resource]
    })
};
const responseNoEnvelope = {
    status: 200,
    json: () => [resource]
};
const invalidAPIResponse = {
    status: 400
};
const transformOut = (localResource) => {
    return Object.assign({}, localResource, { exampleJson: JSON.stringify(localResource.exampleJson) });
};
const transformIn = (localResource) => {
    return Object.assign({}, localResource, { exampleJson: JSON.parse(localResource.exampleJson) });
};
const relationSchema = new normalizr_1.schema.Entity('relation');
const modelSchema = new normalizr_1.schema.Entity('model', {
    relations: [relationSchema]
});
const normalisedModelData = normalizr_1.normalize(resource, modelSchema);
// Unnormalised data
modelResource = createAPIResource_1.default({ resourceName, baseUrl });
modelResourceWithTransforms = createAPIResource_1.default({ resourceName, baseUrl, options: { transformIn, transformOut } });
actionTypes = redux_crud_1.default.actionTypesFor(resourceName);
actionCreators = redux_crud_1.default.actionCreatorsFor(resourceName);
// Normalised data
relationActionCreators = redux_crud_1.default.actionCreatorsFor(resourceName);
relationResource = createAPIResource_1.default({
    resourceName,
    baseUrl,
    relations: {
        schema: modelSchema,
        map: { relation: relationActionCreators }
    }
});
describe('(Util) asyncActionCreator', () => {
    it('creates a create action name and action', () => {
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
    it('creates a fetch action name and action', () => {
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
    it('creates an update action name and action', () => {
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
    it('creates a delete action name and action', () => {
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
    it('creates a search action name and action', () => {
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
    it('creates a create watcher saga', () => {
        const iterator = modelResource.sagas.create();
        const expectedYield = effects_1.call(redux_saga_1.takeLatest, modelResource.actionNames.create, modelResource.workers.create);
        expect(iterator.next().value).toEqual(expectedYield);
    });
    it('creates a fetch watcher saga', () => {
        const iterator = modelResource.sagas.fetch();
        const expectedYield = effects_1.call(redux_saga_1.takeLatest, modelResource.actionNames.fetch, modelResource.workers.fetch);
        expect(iterator.next().value).toEqual(expectedYield);
    });
    it('creates an update watcher saga', () => {
        const iterator = modelResource.sagas.update();
        const expectedYield = effects_1.call(redux_saga_1.takeLatest, modelResource.actionNames.update, modelResource.workers.update);
        expect(iterator.next().value).toEqual(expectedYield);
    });
    it('creates a delete watcher saga', () => {
        const iterator = modelResource.sagas.del();
        const expectedYield = effects_1.call(redux_saga_1.takeLatest, modelResource.actionNames.del, modelResource.workers.del);
        expect(iterator.next().value).toEqual(expectedYield);
    });
    it('creates a search watcher saga', () => {
        const iterator = modelResource.sagas.search();
        const expectedYield = effects_1.call(redux_saga_1.takeLatest, modelResource.actionNames.search, modelResource.workers.search);
        expect(iterator.next().value).toEqual(expectedYield);
    });
    describe('Selectors', () => {
        it('should have a selector that fetches models by id', () => {
            expect(modelResource.selectors.findById(state, 1)).toEqual(state[resourceName][1]);
        });
        it('should have a selector that fetches models by cid', () => {
            expect(modelResource.selectors.findByCid(state, 'exampleCid')).toEqual(state[resourceName][4]);
        });
        it('should have a selector that filters by predicate', () => {
            expect(modelResource.selectors.filter(state, (item) => item.id > 2).length).toBe(2);
            expect(modelResource.selectors.filter(state, (item) => item.name.includes('example')).length).toBe(3);
        });
        it('should have a selector that returns all of the things', () => {
            expect(modelResource.selectors.findAll(state)).toEqual(state[resourceName]);
        });
    });
    describe('Fetch worker', () => {
        it('makes fetch requests and handles valid array responses', () => {
            const iterator = modelResource.workers.fetch(modelResource.actions.fetch({ resource }));
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
        it('makes fetch requests and applies transforms', () => {
            const iterator = modelResourceWithTransforms.workers.fetch(modelResourceWithTransforms.actions.fetch({ resource }));
            // The first yield dispatches the start action.
            expect(iterator.next().value).toEqual(effects_1.put(actionCreators.fetchStart(resource)));
            // Use fetch to make the API call
            expect(iterator.next().value).toEqual(effects_1.call(fetch, '/api/model/1', { method: 'GET', headers: new Headers() }));
            // Deal with the promise returned by the fetch .json() call
            expect(iterator.next(arrayResponse).value).toEqual(effects_1.apply(arrayResponse, arrayResponse.json));
            // Dispatch the success action, which should apply the transformation to the incoming data
            expect(iterator.next(arrayResponse.json()).value)
                .toEqual(effects_1.put(actionCreators.fetchSuccess(arrayResponse.json().data.map(data => transformIn(data)))));
            // Resolve the caller Promise via the action meta, which should also return transformed data
            expect(iterator.next().value).toEqual(effects_1.call(noop_1.default, arrayResponse.json().data.map(data => transformIn(data))));
        });
        it('makes fetch requests and handles responses without an envelope', () => {
            const iterator = modelResource.workers.fetch(modelResource.actions.fetch({ resource }));
            expect(iterator.next().value).toEqual(effects_1.put(actionCreators.fetchStart(resource)));
            expect(iterator.next().value).toEqual(effects_1.call(fetch, '/api/model/1', { method: 'GET', headers: new Headers() }));
            expect(iterator.next(responseNoEnvelope).value).toEqual(effects_1.apply(responseNoEnvelope, responseNoEnvelope.json));
            expect(iterator.next(responseNoEnvelope.json()).value)
                .toEqual(effects_1.put(actionCreators.fetchSuccess(responseNoEnvelope.json())));
            expect(iterator.next().value).toEqual(effects_1.call(noop_1.default, responseNoEnvelope.json()));
        });
        it('makes fetch requests and makes appropriate calls if relations are defined', () => {
            const iterator = relationResource.workers.fetch(relationResource.actions.fetch({ resource }));
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
        it('makes fetch requests and handles errors', () => {
            const iterator = modelResource.workers.fetch(modelResource.actions.fetch({ resource }));
            expect(iterator.next().value).toEqual(effects_1.put(actionCreators.fetchStart(resource)));
            expect(iterator.next().value).toEqual(effects_1.call(fetch, '/api/model/1', { method: 'GET', headers: new Headers() }));
            expect(iterator.next(invalidAPIResponse).value).toEqual(effects_1.put(actionCreators.fetchError(errorMessage)));
            expect(iterator.next().value).toEqual(effects_1.call(noop_1.default, errorMessage));
        });
        it('makes requests with bearer auth if a selector is supplied', () => {
            const selectAuthToken = () => 'token';
            const modelResourceWithAuth = createAPIResource_1.default({
                resourceName,
                baseUrl,
                selectAuthToken
            });
            const iterator = modelResourceWithAuth.workers.fetch(modelResource.actions.fetch({ resource }));
            expect(iterator.next().value).toEqual(effects_1.put(actionCreators.fetchStart(resource)));
            expect(iterator.next().value).toEqual(effects_1.select(selectAuthToken));
            expect(iterator.next('token').value).toEqual(effects_1.call(fetch, '/api/model/1', {
                method: 'GET',
                headers: new Headers({
                    Authorization: 'Bearer token'
                })
            }));
            expect(iterator.next(arrayResponse).value).toEqual(effects_1.apply(arrayResponse, arrayResponse.json));
            expect(iterator.next(arrayResponse.json()).value)
                .toEqual(effects_1.put(actionCreators.fetchSuccess(arrayResponse.json().data)));
        });
        it('makes fetch requests to arbitrary endpoints', () => {
            const iterator = modelResource.workers.fetch(modelResource.actions.fetch({ resource: null, options: { endpoint: 'recent' } }));
            // Use fetch to make the API call
            expect(iterator.next().value)
                .toEqual(effects_1.call(fetch, '/api/model/recent', { method: 'GET', headers: new Headers() }));
            // Deal with the promise returned by the fetch .json() call
            expect(iterator.next(arrayResponse).value).toEqual(effects_1.apply(arrayResponse, arrayResponse.json));
            // Dispatch the success action
            expect(iterator.next(arrayResponse.json()).value)
                .toEqual(effects_1.put(actionCreators.fetchSuccess(arrayResponse.json().data)));
            // Resolve the caller Promise via the action meta
            expect(iterator.next().value).toEqual(effects_1.call(noop_1.default, arrayResponse.json().data));
        });
    });
    describe('Update worker', () => {
        it('makes update requests and handles valid responses', () => {
            const iterator = modelResource.workers.update(modelResource.actions.update({ resource }));
            expect(iterator.next().value).toEqual(effects_1.select(modelResource.selectors.findById, resource.id));
            expect(iterator.next(resource).value).toEqual(effects_1.put(actionCreators.updateStart(resource)));
            const headers = new Headers();
            headers.append('content-type', 'application/json');
            expect(iterator.next().value).toEqual(effects_1.call(fetch, '/api/model/1', {
                method: 'PUT',
                body: JSON.stringify(resource),
                headers
            }));
            expect(iterator.next(response).value).toEqual(effects_1.apply(response, response.json));
            expect(iterator.next(response.json()).value).toEqual(effects_1.put(actionCreators.updateSuccess(response.json().data)));
            expect(iterator.next().value).toEqual(effects_1.call(noop_1.default, response.json().data));
        });
        it('makes update requests and merges existing model with updates', () => {
            const resourceFromState = Object.assign({}, resource, { isMerged: true });
            const iterator = modelResource.workers.update(modelResource.actions.update({ resource }));
            expect(iterator.next().value).toEqual(effects_1.select(modelResource.selectors.findById, resource.id));
            expect(iterator.next(resourceFromState).value).toEqual(effects_1.put(actionCreators.updateStart(resourceFromState)));
            const headers = new Headers();
            headers.append('content-type', 'application/json');
            expect(iterator.next().value).toEqual(effects_1.call(fetch, '/api/model/1', {
                method: 'PUT',
                body: JSON.stringify(resourceFromState),
                headers
            }));
        });
        it('should throw if the model being updated cannot be found in the local state	', () => {
            const iterator = modelResource.workers.update(modelResource.actions.update({ resource }));
            expect(iterator.next().value).toEqual(effects_1.select(modelResource.selectors.findById, resource.id));
            expect(iterator.next(null).value).toEqual(effects_1.call(noop_1.default, `Could not select model with id ${resource.id}`));
        });
        it('makes update requests and apply transformations', () => {
            const iterator = modelResourceWithTransforms.workers.update(modelResourceWithTransforms.actions.update({ resource }));
            expect(iterator.next().value).toEqual(effects_1.select(modelResourceWithTransforms.selectors.findById, resource.id));
            expect(iterator.next(resource).value).toEqual(effects_1.put(actionCreators.updateStart(resource)));
            const headers = new Headers();
            headers.append('content-type', 'application/json');
            // The data going to the endpoint should have been run through the transform function
            expect(iterator.next().value).toEqual(effects_1.call(fetch, '/api/model/1', {
                method: 'PUT',
                body: JSON.stringify(transformOut(resource)),
                headers
            }));
        });
        it('makes update requests and applies relations on optimistic update', () => {
            const iterator = relationResource.workers.update(relationResource.actions.update({ resource }));
            // We expect the resource to update the relations and the model optimistically
            expect(iterator.next().value).toEqual(effects_1.select(relationResource.selectors.findById, resource.id));
            expect(iterator.next(resource).value).toEqual(effects_1.put(redux_batched_actions_1.batchActions([
                relationActionCreators.updateStart(normalisedModelData.entities.relation[1]),
                relationActionCreators.updateStart(normalisedModelData.entities.relation[2])
            ])));
            expect(iterator.next(resource).value).toEqual(effects_1.put(redux_batched_actions_1.batchActions([
                actionCreators.updateStart(normalisedModelData.entities.model[1])
            ])));
            const headers = new Headers();
            headers.append('content-type', 'application/json');
            // The data going to the endpoint should have been run through the transform function
            expect(iterator.next().value).toEqual(effects_1.call(fetch, '/api/model/1', {
                method: 'PUT',
                body: JSON.stringify(resource),
                headers
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
        it('makes update requests and handles errors', () => {
            const iterator = modelResource.workers.update(modelResource.actions.update({ resource }));
            expect(iterator.next().value).toEqual(effects_1.select(modelResource.selectors.findById, resource.id));
            expect(iterator.next(resource).value).toEqual(effects_1.put(actionCreators.updateStart(resource)));
            const headers = new Headers();
            headers.append('content-type', 'application/json');
            expect(iterator.next().value).toEqual(effects_1.call(fetch, '/api/model/1', {
                method: 'PUT',
                body: JSON.stringify(resource),
                headers
            }));
            expect(iterator.next(invalidAPIResponse).value).toEqual(effects_1.put(actionCreators.updateError(errorMessage, resource)));
            expect(iterator.next().value).toEqual(effects_1.call(noop_1.default, errorMessage));
        });
    });
    describe('Create worker', () => {
        it('makes create requests and handles valid responses', () => {
            const iterator = modelResource.workers.create(modelResource.actions.create({ resource: Object.assign({}, resource, { id: 'cid' }) }));
            expect(iterator.next().value).toEqual(effects_1.put(actionCreators.createStart(Object.assign({}, resource, { id: 'cid' }))));
            const headers = new Headers();
            headers.append('content-type', 'application/json');
            const bodyContent = Object.assign({}, resource);
            delete bodyContent.id;
            expect(iterator.next().value).toEqual(effects_1.call(fetch, '/api/model', {
                method: 'POST',
                body: JSON.stringify(bodyContent),
                headers
            }));
            expect(iterator.next(response).value).toEqual(effects_1.apply(response, response.json));
            expect(iterator.next(response.json()).value).toEqual(effects_1.put(actionCreators.createSuccess(resource, 'cid')));
            expect(iterator.next().value).toEqual(effects_1.call(noop_1.default, response.json().data));
        });
        it('makes create requests and handles errors', () => {
            const iterator = modelResource.workers.create(modelResource.actions.create({ resource: Object.assign({}, resource, { id: 'cid' }) }));
            expect(iterator.next().value).toEqual(effects_1.put(actionCreators.createStart(Object.assign({}, resource, { id: 'cid' }))));
            const headers = new Headers();
            headers.append('content-type', 'application/json');
            const bodyContent = Object.assign({}, resource);
            delete bodyContent.id;
            expect(iterator.next().value).toEqual(effects_1.call(fetch, '/api/model', {
                method: 'POST',
                body: JSON.stringify(bodyContent),
                headers
            }));
            expect(iterator.next(invalidAPIResponse).value).toEqual(effects_1.put(actionCreators.createError(errorMessage, Object.assign({}, resource, { id: 'cid' }))));
            expect(iterator.next().value).toEqual(effects_1.call(noop_1.default, errorMessage));
        });
    });
    describe('Delete worker', () => {
        it('Creates delete requests and handles valid responses', () => {
            const iterator = modelResource.workers.del(modelResource.actions.del({ resource }));
            expect(iterator.next().value).toEqual(effects_1.put(actionCreators.deleteStart(resource)));
            expect(iterator.next().value)
                .toEqual(effects_1.call(fetch, '/api/model/1', { method: 'DELETE', headers: new Headers() }));
            expect(iterator.next({ status: 200 }).value).toEqual(effects_1.put(actionCreators.deleteSuccess(resource)));
            expect(iterator.next().value).toEqual(effects_1.call(noop_1.default, resource));
        });
        it('Creates delete requests and handles errors', () => {
            const iterator = modelResource.workers.del(modelResource.actions.del({ resource }));
            expect(iterator.next().value).toEqual(effects_1.put(actionCreators.deleteStart(resource)));
            expect(iterator.next().value)
                .toEqual(effects_1.call(fetch, '/api/model/1', { method: 'DELETE', headers: new Headers() }));
            expect(iterator.next({ status: 400 }).value).toEqual(effects_1.put(actionCreators.deleteError(errorMessage, resource)));
            expect(iterator.next().value).toEqual(effects_1.call(noop_1.default, errorMessage));
        });
        it('Creates delete requests and doesn\'t apply transforms to local data', () => {
            const iterator = modelResourceWithTransforms.workers.del(modelResourceWithTransforms.actions.del({ resource }));
            expect(iterator.next().value).toEqual(effects_1.put(actionCreators.deleteStart(resource)));
            expect(iterator.next().value)
                .toEqual(effects_1.call(fetch, '/api/model/1', { method: 'DELETE', headers: new Headers() }));
            expect(iterator.next({ status: 200 }).value).toEqual(effects_1.put(actionCreators.deleteSuccess(resource)));
            expect(iterator.next().value).toEqual(effects_1.call(noop_1.default, resource));
        });
    });
    describe('Search worker', () => {
        it('Creates search requests and handles valid responses', () => {
            const searchParams = {
                dateFrom: '01/12/2016',
                dateTo: '02/12/2016'
            };
            const searchResponse = {
                status: 200,
                json: () => ({
                    data: [{
                            id: 1,
                            exampleData: 'exampleData'
                        }]
                })
            };
            const iterator = modelResource.workers.search(modelResource.actions.search({ resource: searchParams }));
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
        it('Creates search requests and normalises responses', () => {
            const searchParams = {
                dateFrom: '01/12/2016',
                dateTo: '02/12/2016'
            };
            const iterator = relationResource.workers.search(modelResource.actions.search({ resource: searchParams }));
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
        it('Creates search requests and handles errors', () => {
            const searchParams = {
                dateFrom: '01/12/2016',
                dateTo: '02/12/2016'
            };
            const iterator = modelResource.workers.search(modelResource.actions.search({ resource: searchParams }));
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
//# sourceMappingURL=createAPIResource.spec.js.map