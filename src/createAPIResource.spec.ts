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
        await store.dispatch(modelResource.actions.fetch({ resource }))
        // The first yield dispatches the start action.
        const actions = store.getActions()
        expect(actions[0]).toEqual(actionCreators.fetchStart(resource))
        expect(actions[1]).toEqual(actionCreators.fetchSuccess(arrayResponse.data))
      })

      it('makes fetch requests and applies transforms', async () => {
        const store = mockStore()
        fetchMock.mock('/api/model/1', arrayResponse)
        const result = await store.dispatch(modelResourceWithTransforms.actions.fetch({ resource }))
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
        await store.dispatch(modelResource.actions.fetch({ resource }))
        // The first yield dispatches the start action.
        const actions = store.getActions()
        expect(actions[0]).toEqual(actionCreators.fetchStart(resource))
        expect(actions[1]).toEqual(actionCreators.fetchSuccess(responseNoEnvelope))
      })

      it('makes fetch requests and makes appropriate calls if relations are defined', async () => {
        const store = mockStore()
        fetchMock.mock('/api/model/1', arrayResponse)
        await store.dispatch(relationResource.actions.fetch({ resource }))
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
        await store.dispatch(modelResource.actions.fetch({ resource }))
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
        await store.dispatch(modelResourceWithAuth.actions.fetch({ resource }))
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
            resource,
            options: { endpoint: 'recent' }
          })
        )
        // The first yield dispatches the start action.
        const actions = store.getActions()
        expect(actions[0]).toEqual(actionCreators.fetchStart(resource))
        expect(actions[1]).toEqual(actionCreators.fetchSuccess(arrayResponse.data))
      })
    })

    describe('Update worker', () => {
      it('makes update requests and handles valid responses', async () => {
        const store = mockStore({
          model: {
            1: {}
          }
        })
        fetchMock.mock('/api/model/1', response, { method: 'PUT' })
        await store.dispatch(modelResource.actions.update({ resource }))
        // The first yield dispatches the start action.
        const actions = store.getActions()
        expect(actions[0]).toEqual(actionCreators.updateStart(resource))
        expect(actions[1]).toEqual(actionCreators.updateSuccess(response.data))
      })

      it('makes update requests and merges existing model with updates', async () => {
        const store = mockStore({
          model: {
            1: { ...resource, isMerged: true }
          }
        })
        fetchMock.mock(
          (url, opts) => {
            // Body doesn't exist on the typings here, but it should!
            expect((opts as any).body).toBe(JSON.stringify(resource))
            return url === '/api/model/1'
          },
          response,
          { method: 'PUT' }
        )
        await store.dispatch(modelResource.actions.update({ resource }))
        // The first yield dispatches the start action.
        const actions = store.getActions()
        expect(actions[0]).toEqual(actionCreators.updateStart({ ...resource, isMerged: true }))
      })

      it('should throw if the model being updated cannot be found in the local state	', async () => {
        const store = mockStore()
        return expect(store.dispatch(modelResource.actions.update({ resource }))).rejects
      })

      it('makes update requests and apply transformations', async () => {
        const store = mockStore({
          model: {
            1: resource
          }
        })
        fetchMock.mock(
          (url, opts) => {
            // Body doesn't exist on the typings here, but it should!
            expect((opts as any).body).toBe(JSON.stringify(transformOut(resource)))
            return url === '/api/model/1'
          },
          response,
          { method: 'PUT' }
        )

        await store.dispatch(modelResourceWithTransforms.actions.update({ resource }))
        // The first yield dispatches the start action.
        const actions = store.getActions()
        expect(actions[0]).toEqual(actionCreators.updateStart(resource))
      })

      it('makes update requests and applies relations on optimistic update', async () => {
        const store = mockStore({
          model: {
            1: resource
          }
        })
        fetchMock.mock(
          (url, opts) => {
            // Body doesn't exist on the typings here, but it should!
            expect((opts as any).body).toBe(JSON.stringify(resource))
            return url === '/api/model/1'
          },
          response,
          { method: 'PUT' }
        )

        await store.dispatch(relationResource.actions.update({ resource }))

        const actions = store.getActions()
        // We expect the resource to update the relations and the model optimistically
        expect(actions[0]).toEqual(
          batchActions([
            relationActionCreators.updateStart(normalisedModelData.entities.relation[1]),
            relationActionCreators.updateStart(normalisedModelData.entities.relation[2])
          ])
        )
        expect(actions[1]).toEqual(
          batchActions([actionCreators.updateStart(normalisedModelData.entities.model[1])])
        )

        expect(actions[2]).toEqual(
          batchActions([
            actionCreators.updateSuccess(normalisedModelData.entities.relation[1], '1'),
            actionCreators.updateSuccess(normalisedModelData.entities.relation[2], '2')
          ])
        )
        expect(actions[3]).toEqual(
          batchActions([actionCreators.updateSuccess(normalisedModelData.entities.model[1], '1')])
        )
      })

      it('makes update requests and handles errors', async () => {
        const store = mockStore({
          model: {
            1: resource
          }
        })
        fetchMock.mock('/api/model/1', 400, { method: 'PUT' })
        await store.dispatch(modelResource.actions.update({ resource }))
        // The first yield dispatches the start action.
        const actions = store.getActions()
        expect(actions[0]).toEqual(actionCreators.updateStart(resource))
        expect(actions[1]).toEqual(actionCreators.updateError(errorMessage, resource))
      })
    })

    describe('Create worker', () => {
      it('makes create requests and handles valid responses', async () => {
        const store = mockStore()
        fetchMock.mock(
          (url, options) => {
            const bodyContent = Object.assign({}, resource)
            delete bodyContent.id
            expect((options as any).body).toEqual(JSON.stringify(bodyContent))
            return url === '/api/model'
          },
          resource,
          { method: 'POST' }
        )
        await store.dispatch(modelResource.actions.create({ resource: { ...resource, id: 'cid' } }))
        // The first yield dispatches the start action.
        const actions = store.getActions()
        expect(actions[1]).toEqual(actionCreators.createSuccess(resource, 'cid'))
      })

      it('makes create requests and handles errors', async () => {
        const store = mockStore()
        fetchMock.mock(
          (url, options) => {
            const bodyContent = Object.assign({}, resource)
            delete bodyContent.id
            expect((options as any).body).toEqual(JSON.stringify(bodyContent))
            return url === '/api/model'
          },
          invalidAPIResponse,
          { method: 'POST' }
        )
        await store.dispatch(modelResource.actions.create({ resource: { ...resource, id: 'cid' } }))
        // The first yield dispatches the start action.
        const actions = store.getActions()
        expect(actions[1]).toEqual(
          actionCreators.createError(errorMessage, { ...resource, id: 'cid' })
        )
      })
    })

    describe('Delete worker', () => {
      it('Creates delete requests and handles valid responses', async () => {
        const store = mockStore({
          model: {
            1: resource
          }
        })
        fetchMock.mock('/api/model/1', 200, { method: 'DELETE' })
        await store.dispatch(modelResource.actions.del({ resource }))
        // The first yield dispatches the start action.
        const actions = store.getActions()
        expect(actions[0]).toEqual(actionCreators.deleteStart(resource))
        expect(actions[1]).toEqual(actionCreators.deleteSuccess(resource))
      })

      it('Creates delete requests and handles errors', async () => {
        const store = mockStore({
          model: {
            1: resource
          }
        })
        fetchMock.mock('/api/model/1', 400, { method: 'DELETE' })
        await store.dispatch(modelResource.actions.del({ resource }))
        // The first yield dispatches the start action.
        const actions = store.getActions()
        expect(actions[0]).toEqual(actionCreators.deleteStart(resource))
        expect(actions[1]).toEqual(actionCreators.deleteError(errorMessage, resource))
      })

      it("Creates delete requests and doesn't apply transforms to local data", async () => {
        const store = mockStore({
          model: {
            1: resource
          }
        })
        fetchMock.mock('/api/model/1', 200, { method: 'DELETE' })
        await store.dispatch(modelResourceWithTransforms.actions.del({ resource }))
        // The first yield dispatches the start action.
        const actions = store.getActions()
        expect(actions[0]).toEqual(actionCreators.deleteStart(resource))
        expect(actions[1]).toEqual(actionCreators.deleteSuccess(resource))
      })
    })

    describe('Search worker', () => {
      it('Creates search requests and handles valid responses', async () => {
        const searchParams = {
          dateFrom: '01/12/2016',
          dateTo: '02/12/2016'
        }
        const searchResponse = {
          data: [
            {
              id: 1,
              exampleData: 'exampleData'
            }
          ]
        }
        const store = mockStore()
        fetchMock.mock('/api/model', searchResponse)
        await store.dispatch(modelResource.actions.fetch({ resource: searchParams }))

        const actions = store.getActions()
        expect(actions[0]).toEqual(actionCreators.fetchStart(searchParams))
        expect(actions[1]).toEqual(actionCreators.fetchSuccess(searchResponse.data))
      })

      it('Creates search requests and normalises responses', async () => {
        const searchParams = {
          dateFrom: '01/12/2016',
          dateTo: '02/12/2016'
        }

        const store = mockStore()
        fetchMock.mock('/api/model', response)
        await store.dispatch(relationResource.actions.fetch({ resource: searchParams }))

        const actions = store.getActions()
        expect(actions[0]).toEqual(actionCreators.fetchStart(searchParams))
        expect(actions[1]).toEqual(
          batchActions([
            actionCreators.fetchSuccess(normalisedModelData.entities.relation[1]),
            actionCreators.fetchSuccess(normalisedModelData.entities.relation[2])
          ])
        )
        expect(actions[2]).toEqual(
          batchActions([actionCreators.fetchSuccess(normalisedModelData.entities.model[1])])
        )
      })

      it('Creates search requests and handles errors', async () => {
        const searchParams = {
          dateFrom: '01/12/2016',
          dateTo: '02/12/2016'
        }

        const store = mockStore()
        fetchMock.mock('/api/model', 400)
        await store.dispatch(relationResource.actions.fetch({ resource: searchParams }))

        const actions = store.getActions()
        expect(actions[0]).toEqual(actionCreators.fetchStart(searchParams))
        expect(actions[1]).toEqual(actionCreators.fetchError(errorMessage))

        // expect(iterator.next().value).toEqual(
        //   call(fetch, "/api/model/search?" + qs.stringify(searchParams), {
        //     method: "GET",
        //     headers: new Headers()
        //   })
        // );
      })
    })
  })
})
