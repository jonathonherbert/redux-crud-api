import noop from 'lodash/noop'
import { normalize, schema } from 'normalizr'
import * as qs from 'querystring'
import { batchActions } from 'redux-batched-actions'
import reduxCrud from 'redux-crud'
import fetchMock from 'fetch-mock'
import 'whatwg-fetch'
import configureStore from 'redux-mock-store'
import thunk from 'redux-thunk'

import createAPIResource from './createAPIResource'

let modelResource: any
let modelResourceWithTransforms: any
let relationResource: any
let actionTypes
let actionCreators: any
let relationActionCreators: any
const baseUrl = '/api'
const resourceName = 'model'
const errorMessage = 'HTTP Error: 400'
const mockStore = configureStore([thunk])

const resource = {
  id: 1,
  exampleData: 'exampleData',
  exampleJson: '{"key":"value"}',
  relations: [
    {
      id: 1,
      name: 'relation1'
    },
    {
      id: 2,
      name: 'relation2'
    }
  ]
}

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
}

const response = {
  data: resource
}

const arrayResponse = {
  data: [resource]
}

const responseNoEnvelope = [resource]

const invalidAPIResponse = {
  status: 400
}

const transformOut = (localResource: any) => {
  return { ...localResource, exampleJson: JSON.stringify(localResource.exampleJson) }
}

const transformIn = (localResource: any) => {
  return { ...localResource, exampleJson: JSON.parse(localResource.exampleJson) }
}

const relationSchema = new schema.Entity('relation')
const modelSchema = new schema.Entity('model', {
  relations: [relationSchema]
})

const normalisedModelData = normalize(resource, modelSchema)

// Unnormalised data
modelResource = createAPIResource({ resourceName, baseUrl })
modelResourceWithTransforms = createAPIResource({
  resourceName,
  baseUrl,
  options: { transformIn, transformOut }
})
actionTypes = reduxCrud.actionTypesFor(resourceName)
actionCreators = reduxCrud.actionCreatorsFor(resourceName)

// Normalised data
relationActionCreators = reduxCrud.actionCreatorsFor(resourceName)
relationResource = createAPIResource({
  resourceName,
  baseUrl,
  relations: {
    schema: modelSchema,
    map: { relation: relationActionCreators }
  }
})

describe('createAPIResource', () => {
  describe('Selectors', () => {
    it('should have a selector that fetches models by id', () => {
      expect(modelResource.selectors.findById(state, 1)).toEqual(state[resourceName][1])
    })
    it('should have a selector that fetches models by cid', () => {
      expect(modelResource.selectors.findByCid(state, 'exampleCid')).toEqual(state[resourceName][4])
    })
    it('should have a selector that filters by predicate', () => {
      expect(modelResource.selectors.filter(state, (item: any) => item.id > 2).length).toBe(2)
      expect(
        modelResource.selectors.filter(state, (item: any) => item.name.includes('example')).length
      ).toBe(3)
    })
    it('should have a selector that returns all of the things', () => {
      expect(modelResource.selectors.findAll(state)).toEqual(state[resourceName])
    })
  })

  describe('Actions', () => {
    beforeEach(fetchMock.restore)
    describe('Fetch worker', () => {
      it('makes fetch requests and handles valid array responses', async () => {
        const store = mockStore()
        fetchMock.mock('/api/model/1', arrayResponse)
        await store.dispatch(modelResource.actions.fetch({ payload: { resource } }))
        // The first yield dispatches the start action.
        const actions = store.getActions()
        expect(actions[0]).toEqual(actionCreators.fetchStart(resource))
        expect(actions[1]).toEqual(actionCreators.fetchSuccess(arrayResponse.data))
      })

      it('makes fetch requests and applies transforms', async () => {
        const store = mockStore()
        fetchMock.mock('/api/model/1', arrayResponse)
        const result = await store.dispatch(
          modelResourceWithTransforms.actions.fetch({ payload: { resource } })
        )
        // The first yield dispatches the start action.
        const actions = store.getActions()
        expect(actions[0]).toEqual(actionCreators.fetchStart(resource))
        expect(actions[1]).toEqual(
          actionCreators.fetchSuccess(arrayResponse.data.map(data => transformIn(data)))
        )

        // Resolve the caller Promise via the action meta, which should also return transformed data
        expect(result).toEqual(arrayResponse.data.map(data => transformIn(data)))
      })

      it('makes fetch requests and handles responses without an envelope', async () => {
        const store = mockStore()
        fetchMock.mock('/api/model/1', responseNoEnvelope)
        await store.dispatch(modelResource.actions.fetch({ payload: { resource } }))
        // The first yield dispatches the start action.
        const actions = store.getActions()
        expect(actions[0]).toEqual(actionCreators.fetchStart(resource))
        expect(actions[1]).toEqual(actionCreators.fetchSuccess(responseNoEnvelope))
      })

      it('makes fetch requests and makes appropriate calls if relations are defined', async () => {
        const store = mockStore()
        fetchMock.mock('/api/model/1', arrayResponse)
        await store.dispatch(relationResource.actions.fetch({ payload: { resource } }))
        // The first yield dispatches the start action.
        const actions = store.getActions()
        expect(actions[0]).toEqual(actionCreators.fetchStart(resource))
        // The first dispatched action should be the normalised relation data
        expect(actions[1]).toEqual(
          batchActions([
            actionCreators.fetchSuccess(normalisedModelData.entities.relation[1]),
            actionCreators.fetchSuccess(normalisedModelData.entities.relation[2])
          ])
        )
        // And the next should be the normalised model data
        expect(actions[2]).toEqual(
          batchActions([actionCreators.fetchSuccess(normalisedModelData.entities.model[1])])
        )
      })

      it('makes fetch requests and handles errors', async () => {
        const store = mockStore()
        fetchMock.mock('/api/model/1', 400)
        await store.dispatch(modelResource.actions.fetch({ payload: { resource } }))
        // The first yield dispatches the start action.
        const actions = store.getActions()
        expect(actions[0]).toEqual(actionCreators.fetchStart(resource))
        expect(actions[1]).toEqual(actionCreators.fetchError(errorMessage))
      })

      it('makes requests with bearer auth if a selector is supplied', async () => {
        const store = mockStore()
        const selectAuthToken = () => 'token'
        const modelResourceWithAuth = createAPIResource({
          resourceName,
          baseUrl,
          selectAuthToken
        })
        fetchMock.mock('/api/model/1', arrayResponse)
        await store.dispatch(modelResourceWithAuth.actions.fetch({ payload: { resource } }))
        // The first yield dispatches the start action.
        const actions = store.getActions()
        expect(actions[0]).toEqual(actionCreators.fetchStart(resource))
        expect(actions[1]).toEqual(actionCreators.fetchSuccess(arrayResponse.data))
        expect(fetchMock.lastCall()[1].headers).toEqual(
          new Headers({
            Authorization: 'Bearer token'
          })
        )
      })

      it('makes fetch requests to arbitrary endpoints', async () => {
        const store = mockStore()
        fetchMock.mock('/api/recent/1', arrayResponse)
        await store.dispatch(
          modelResource.actions.fetch({
            payload: {
              resource,
              options: { endpoint: 'recent' }
            }
          })
        )
        // The first yield dispatches the start action.
        const actions = store.getActions()
        expect(actions[0]).toEqual(actionCreators.fetchStart(resource))
        expect(actions[1]).toEqual(actionCreators.fetchSuccess(arrayResponse.data))
      })
    })

    describe('Update worker', () => {
      it('makes update requests and handles valid responses', () => {
        const iterator = modelResource.workers.update(modelResource.actions.update({ resource }))
        expect(iterator.next().value).toEqual(select(modelResource.selectors.findById, resource.id))
        expect(iterator.next(resource).value).toEqual(put(actionCreators.updateStart(resource)))
        const headers = new Headers()
        headers.append('content-type', 'application/json')
        expect(iterator.next().value).toEqual(
          call(fetch, '/api/model/1', {
            method: 'PUT',
            body: JSON.stringify(resource),
            headers
          })
        )
        expect(iterator.next(response).value).toEqual(apply(response, response.json))
        expect(iterator.next(response.json()).value).toEqual(
          put(actionCreators.updateSuccess(response.json().data))
        )
        expect(iterator.next().value).toEqual(call(noop, response.json().data))
      })

      it('makes update requests and merges existing model with updates', () => {
        const resourceFromState = { ...resource, isMerged: true }
        const iterator = modelResource.workers.update(modelResource.actions.update({ resource }))
        expect(iterator.next().value).toEqual(select(modelResource.selectors.findById, resource.id))
        expect(iterator.next(resourceFromState).value).toEqual(
          put(actionCreators.updateStart(resourceFromState))
        )
        const headers = new Headers()
        headers.append('content-type', 'application/json')
        expect(iterator.next().value).toEqual(
          call(fetch, '/api/model/1', {
            method: 'PUT',
            body: JSON.stringify(resourceFromState),
            headers
          })
        )
      })

      it('should throw if the model being updated cannot be found in the local state	', () => {
        const iterator = modelResource.workers.update(modelResource.actions.update({ resource }))
        expect(iterator.next().value).toEqual(select(modelResource.selectors.findById, resource.id))
        expect(iterator.next(null).value).toEqual(
          call(noop, `Could not select model with id ${resource.id}`)
        )
      })

      it('makes update requests and apply transformations', () => {
        const iterator = modelResourceWithTransforms.workers.update(
          modelResourceWithTransforms.actions.update({ resource })
        )
        expect(iterator.next().value).toEqual(
          select(modelResourceWithTransforms.selectors.findById, resource.id)
        )
        expect(iterator.next(resource).value).toEqual(put(actionCreators.updateStart(resource)))
        const headers = new Headers()
        headers.append('content-type', 'application/json')

        // The data going to the endpoint should have been run through the transform function
        expect(iterator.next().value).toEqual(
          call(fetch, '/api/model/1', {
            method: 'PUT',
            body: JSON.stringify(transformOut(resource)),
            headers
          })
        )
      })

      it('makes update requests and applies relations on optimistic update', () => {
        const iterator = relationResource.workers.update(
          relationResource.actions.update({ resource })
        )

        // We expect the resource to update the relations and the model optimistically
        expect(iterator.next().value).toEqual(
          select(relationResource.selectors.findById, resource.id)
        )
        expect(iterator.next(resource).value).toEqual(
          put(
            batchActions([
              relationActionCreators.updateStart(normalisedModelData.entities.relation[1]),
              relationActionCreators.updateStart(normalisedModelData.entities.relation[2])
            ])
          )
        )
        expect(iterator.next(resource).value).toEqual(
          put(batchActions([actionCreators.updateStart(normalisedModelData.entities.model[1])]))
        )

        const headers = new Headers()
        headers.append('content-type', 'application/json')
        // The data going to the endpoint should have been run through the transform function
        expect(iterator.next().value).toEqual(
          call(fetch, '/api/model/1', {
            method: 'PUT',
            body: JSON.stringify(resource),
            headers
          })
        )
        expect(iterator.next(response).value).toEqual(apply(response, response.json))
        expect(iterator.next(response.json()).value).toEqual(
          put(
            batchActions([
              actionCreators.updateSuccess(normalisedModelData.entities.relation[1], '1'),
              actionCreators.updateSuccess(normalisedModelData.entities.relation[2], '2')
            ])
          )
        )
        expect(iterator.next().value).toEqual(
          put(
            batchActions([actionCreators.updateSuccess(normalisedModelData.entities.model[1], '1')])
          )
        )
        expect(iterator.next().value).toEqual(call(noop, response.json().data))
      })

      it('makes update requests and handles errors', () => {
        const iterator = modelResource.workers.update(modelResource.actions.update({ resource }))
        expect(iterator.next().value).toEqual(select(modelResource.selectors.findById, resource.id))
        expect(iterator.next(resource).value).toEqual(put(actionCreators.updateStart(resource)))
        const headers = new Headers()
        headers.append('content-type', 'application/json')
        expect(iterator.next().value).toEqual(
          call(fetch, '/api/model/1', {
            method: 'PUT',
            body: JSON.stringify(resource),
            headers
          })
        )
        expect(iterator.next(invalidAPIResponse).value).toEqual(
          put(actionCreators.updateError(errorMessage, resource))
        )
        expect(iterator.next().value).toEqual(call(noop, errorMessage))
      })
    })

    describe('Create worker', () => {
      it('makes create requests and handles valid responses', () => {
        const iterator = modelResource.workers.create(
          modelResource.actions.create({ resource: { ...resource, id: 'cid' } })
        )
        expect(iterator.next().value).toEqual(
          put(
            actionCreators.createStart({
              ...resource,
              id: 'cid'
            })
          )
        )
        const headers = new Headers()
        headers.append('content-type', 'application/json')
        const bodyContent = Object.assign({}, resource)
        delete bodyContent.id
        expect(iterator.next().value).toEqual(
          call(fetch, '/api/model', {
            method: 'POST',
            body: JSON.stringify(bodyContent),
            headers
          })
        )
        expect(iterator.next(response).value).toEqual(apply(response, response.json))
        expect(iterator.next(response.json()).value).toEqual(
          put(actionCreators.createSuccess(resource, 'cid'))
        )
        expect(iterator.next().value).toEqual(call(noop, response.json().data))
      })

      it('makes create requests and handles errors', () => {
        const iterator = modelResource.workers.create(
          modelResource.actions.create({ resource: { ...resource, id: 'cid' } })
        )
        expect(iterator.next().value).toEqual(
          put(
            actionCreators.createStart({
              ...resource,
              id: 'cid'
            })
          )
        )
        const headers = new Headers()
        headers.append('content-type', 'application/json')
        const bodyContent = Object.assign({}, resource)
        delete bodyContent.id
        expect(iterator.next().value).toEqual(
          call(fetch, '/api/model', {
            method: 'POST',
            body: JSON.stringify(bodyContent),
            headers
          })
        )
        expect(iterator.next(invalidAPIResponse).value).toEqual(
          put(actionCreators.createError(errorMessage, { ...resource, id: 'cid' }))
        )
        expect(iterator.next().value).toEqual(call(noop, errorMessage))
      })
    })

    describe('Delete worker', () => {
      it('Creates delete requests and handles valid responses', () => {
        const iterator = modelResource.workers.del(modelResource.actions.del({ resource }))
        expect(iterator.next().value).toEqual(put(actionCreators.deleteStart(resource)))
        expect(iterator.next().value).toEqual(
          call(fetch, '/api/model/1', { method: 'DELETE', headers: new Headers() })
        )
        expect(iterator.next({ status: 200 }).value).toEqual(
          put(actionCreators.deleteSuccess(resource))
        )
        expect(iterator.next().value).toEqual(call(noop, resource))
      })

      it('Creates delete requests and handles errors', () => {
        const iterator = modelResource.workers.del(modelResource.actions.del({ resource }))
        expect(iterator.next().value).toEqual(put(actionCreators.deleteStart(resource)))
        expect(iterator.next().value).toEqual(
          call(fetch, '/api/model/1', { method: 'DELETE', headers: new Headers() })
        )
        expect(iterator.next({ status: 400 }).value).toEqual(
          put(actionCreators.deleteError(errorMessage, resource))
        )
        expect(iterator.next().value).toEqual(call(noop, errorMessage))
      })

      it("Creates delete requests and doesn't apply transforms to local data", () => {
        const iterator = modelResourceWithTransforms.workers.del(
          modelResourceWithTransforms.actions.del({ resource })
        )
        expect(iterator.next().value).toEqual(put(actionCreators.deleteStart(resource)))
        expect(iterator.next().value).toEqual(
          call(fetch, '/api/model/1', { method: 'DELETE', headers: new Headers() })
        )
        expect(iterator.next({ status: 200 }).value).toEqual(
          put(actionCreators.deleteSuccess(resource))
        )
        expect(iterator.next().value).toEqual(call(noop, resource))
      })
    })

    describe('Search worker', () => {
      it('Creates search requests and handles valid responses', () => {
        const searchParams = {
          dateFrom: '01/12/2016',
          dateTo: '02/12/2016'
        }
        const searchResponse = {
          status: 200,
          json: () => ({
            data: [
              {
                id: 1,
                exampleData: 'exampleData'
              }
            ]
          })
        }
        const iterator = modelResource.workers.search(
          modelResource.actions.search({ resource: searchParams })
        )
        expect(iterator.next().value).toEqual(put(actionCreators.fetchStart(searchParams)))
        expect(iterator.next().value).toEqual(
          call(fetch, '/api/model/search?' + qs.stringify(searchParams), {
            method: 'GET',
            headers: new Headers()
          })
        )
        expect(iterator.next(searchResponse).value).toEqual(
          apply(searchResponse, searchResponse.json)
        )
        expect(iterator.next(searchResponse.json()).value).toEqual(
          put(actionCreators.fetchSuccess(searchResponse.json().data))
        )
        expect(iterator.next().value).toEqual(call(noop, searchResponse.json().data))
      })

      it('Creates search requests and normalises responses', () => {
        const searchParams = {
          dateFrom: '01/12/2016',
          dateTo: '02/12/2016'
        }

        const iterator = relationResource.workers.search(
          modelResource.actions.search({ resource: searchParams })
        )
        expect(iterator.next().value).toEqual(put(actionCreators.fetchStart(searchParams)))
        expect(iterator.next().value).toEqual(
          call(fetch, '/api/model/search?' + qs.stringify(searchParams), {
            method: 'GET',
            headers: new Headers()
          })
        )
        expect(iterator.next(response).value).toEqual(apply(response, response.json))

        // The first dispatched action should be the normalised relation data
        expect(iterator.next(response.json()).value).toEqual(
          put(
            batchActions([
              actionCreators.fetchSuccess(normalisedModelData.entities.relation[1]),
              actionCreators.fetchSuccess(normalisedModelData.entities.relation[2])
            ])
          )
        )

        // And the next should be the normalised model data
        expect(iterator.next().value).toEqual(
          put(batchActions([actionCreators.fetchSuccess(normalisedModelData.entities.model[1])]))
        )
        expect(iterator.next().value).toEqual(call(noop, response.json().data))
      })

      it('Creates search requests and handles errors', () => {
        const searchParams = {
          dateFrom: '01/12/2016',
          dateTo: '02/12/2016'
        }
        const iterator = modelResource.workers.search(
          modelResource.actions.search({ resource: searchParams })
        )
        expect(iterator.next().value).toEqual(put(actionCreators.fetchStart(searchParams)))
        expect(iterator.next().value).toEqual(
          call(fetch, '/api/model/search?' + qs.stringify(searchParams), {
            method: 'GET',
            headers: new Headers()
          })
        )
        expect(iterator.next({ status: 400 }).value).toEqual(
          put(actionCreators.fetchError(errorMessage))
        )
        expect(iterator.next().value).toEqual(call(noop, errorMessage))
      })
    })
  })
})
