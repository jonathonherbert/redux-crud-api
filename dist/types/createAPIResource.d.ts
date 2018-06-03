import { ObjectIterator } from "lodash";
import { Schema } from "normalizr";
import "whatwg-fetch";
export declare const mapActionToCRUDAction: {
    create: string;
    del: string;
    fetch: string;
    search: string;
    update: string;
};
export declare type MapActionToCRUDAction = typeof mapActionToCRUDAction;
export declare type ActionTypes = keyof MapActionToCRUDAction;
export declare type CRUDActionTypes = MapActionToCRUDAction[keyof MapActionToCRUDAction];
export interface ICreateAPIResourceOptions {
    resourceName: string;
    baseUrl: string;
    actions?: Array<ActionTypes>;
    selectAuthToken?: (state: any) => string;
    /**
     * The relations options. We provide a Normalizr Schema object
     * 	here to process the incoming data, and a map between any additional entity names and
     * 	their reducer functions. For example:
     * ```js{
     * 	schema: book,
     * 	map: {
     * 		author: author.actions
     * 	}
     * }```
     * would update authors nested in data returned from the Book resource.
     */
    relations?: {
        schema: Schema;
        map: {
            [key: string]: any;
        };
    };
    options?: {
        transformIn: (model: any) => any;
        transformOut: (model: any) => any;
    };
}
export interface IBaseResource {
    id: number | string;
    _cid?: number | string;
    busy?: boolean;
    pendingUpdate?: boolean;
    pendingCreate?: boolean;
}
export interface IState<IResource extends IBaseResource> {
    records: {
        [key: string]: IResource;
    };
    lastFetch: number | null;
}
/**
 * Create the reduce for the given resource.
 */
export declare const createReducer: <IResource extends IBaseResource, IAction extends {
    type: string;
    time?: number | undefined;
}>(resourceName: string) => (state: IState<IResource> | undefined, action: IAction) => IState<IResource>;
/**
 * Create the action creators for the given resource.
 *
 * We augment some of the default 'success' action creators here to include a time property,
 * which lets the reducer store staleness information.
 */
export declare const createActionCreators: (resourceName: string) => {
    fetchStart(data?: any): {
        data: any;
        type: any;
    };
    fetchSuccess(records?: {}[] | undefined, data?: any): {
        data: any;
        records: {}[];
        type: any;
    };
    fetchError(error?: any, data?: any): {
        data: any;
        error: any;
        type: any;
    };
    createStart(record?: {} | undefined, data?: any): {
        data: any;
        record: {};
        type: any;
    };
    createSuccess(record?: {} | undefined, clientGeneratedKey?: any, data?: any): {
        cid: any;
        data: any;
        record: {};
        type: any;
    };
    createError(error?: any, record?: {} | undefined, data?: any): {
        data: any;
        error: any;
        record: {};
        type: any;
    };
    updateStart(record?: {} | undefined, data?: any): {
        data: any;
        record: {};
        type: any;
    };
    updateSuccess(record?: {} | undefined, data?: any): {
        data: any;
        record: {};
        type: any;
    };
    updateError(error?: any, record?: {} | undefined, data?: any): {
        data: any;
        error: any;
        record: {};
        type: any;
    };
    deleteStart(record?: {} | undefined, data?: any): {
        data: any;
        record: {};
        type: any;
    };
    deleteSuccess(record?: {} | undefined, data?: any): {
        data: any;
        record: {};
        type: any;
    };
    deleteError(error?: any, record?: {} | undefined, data?: any): {
        data: any;
        error: any;
        record: {};
        type: any;
    };
};
/**
 * Creates an object with api methods keyed by name.
 * All of these actions can be dispatched as normal.
 * They will dispatch start (where available), success and error actions
 * in turn, making the http request to the API, the idea being, generic CRUD.
 *
 * @returns {IAPIResource}
 */
declare function createAPIResource<IResource extends IBaseResource>({ resourceName, baseUrl, actions, selectAuthToken, relations, options }: ICreateAPIResourceOptions): {
    actions: {
        [action: string]: any;
    };
    actionNames: {
        [actionName: string]: string;
    };
    selectors: {
        /**
         * @inheritdocs
         */
        findById(state: any, id: string | number): IResource;
        /**
         * @inheritdocs
         */
        findByCid(state: any, cid: string | number): IResource | undefined;
        /**
         * @inheritdocs
         */
        filter(state: any, predicate: string | [string, any] | ObjectIterator<{
            [key: string]: IResource;
        }, boolean>): IResource[];
        orderBy(state: any, iteratees: string | string[], order: string | string[]): IResource[];
        /**
         * @inheritdocs
         */
        findAll(state: any): {
            [key: string]: IResource;
        };
        isResourceBusy(state: any, id: string | number): boolean;
        isBusy(state: any, id: string | number): boolean;
        isPendingUpdate(state: any, id: string | number): boolean;
        isPendingCreate(state: any, id: string | number): boolean;
        lastFetch(state: any): number | null;
    };
    reducers: (state: IState<IResource> | undefined, action: {
        data: any;
        type: any;
    } | {
        data: any;
        error: any;
        type: any;
    } | {
        data: any;
        records: {}[];
        type: any;
    } | {
        data: any;
        record: {};
        type: any;
    } | {
        cid: any;
        data: any;
        record: {};
        type: any;
    } | {
        data: any;
        error: any;
        record: {};
        type: any;
    }) => IState<IResource>;
};
export default createAPIResource;
