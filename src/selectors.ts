import { ObjectIterator } from 'lodash'
import filter from 'lodash/filter'
import find from 'lodash/find'
import orderBy from 'lodash/orderBy'
import { IState, IBaseResource } from './createAPIResource'

/**
 * Create selectors for the given resource namespace.
 *
 * @param {string} mountPoint - The name of the resource as appears in the state
 * @return {any} Object with selector methods
 */
export function createSelectors<IResource extends IBaseResource>(mountPoint: string) {
  const getLocalState = (state: any): IState<IResource> => state[mountPoint]
  return {
    /**
     * @inheritdocs
     */
    findById(state: any, id: number | string) {
      return getLocalState(state).records[id] || null
    },

    /**
     * @inheritdocs
     */
    findByCid(state: any, cid: number | string) {
      return find(
        getLocalState(state).records,
        (item: { _cid?: number | string }) => item._cid === cid
      )
    },

    /**
     * @inheritdocs
     */
    filter(
      state: any,
      predicate:
        | string
        | [string, any]
        | ObjectIterator<
            {
              [key: string]: IResource
            },
            boolean
          >
    ) {
      return filter(getLocalState(state).records, predicate)
    },

    orderBy(state: any, iteratees: string[] | string, order: string[] | string) {
      return orderBy(getLocalState(state).records, iteratees, order)
    },

    /**
     * @inheritdocs
     */
    findAll(state: any) {
      return getLocalState(state).records
    },

    isResourceBusy(state: any) {
      return getLocalState(state).busy
    },

    isBusy(state: any, id: number | string) {
      const record = getLocalState(state).records[id]
      return record ? !!record.busy : false
    },

    isPendingUpdate(state: any, id: number | string) {
      const record = getLocalState(state).records[id]
      return record ? !!record.pendingUpdate : false
    },

    isPendingCreate(state: any, id: number | string) {
      const record = getLocalState(state).records[id]
      return record ? !!record.pendingCreate : false
    },

    lastFetch(state: any) {
      return getLocalState(state).lastFetch
    }
  }
}
