import { Schema } from 'normalizr';
import 'whatwg-fetch';
export interface ICreateAPIResourceOptions {
    resourceName: string;
    baseUrl: string;
    actions?: string[];
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
/**
 * Creates an object with api methods keyed by name.
 * All of these actions can be dispatched as normal.
 * They will dispatch start (where available), success and error actions
 * in turn, making the http request to the API, the idea being, generic CRUD.
 *
 * @returns {IAPIResource}
 */
declare function createAPIResource({resourceName, baseUrl, actions, selectAuthToken, relations, options}: ICreateAPIResourceOptions): {
    workers: {
        [action: string]: any;
    };
    sagas: {
        [action: string]: any;
    };
    actions: any;
    actionNames: any;
    selectors: {
        findById(state: any, id: string): any;
        findByCid(state: any, cid: string): any;
        filter(state: any, predicate: Function): any[];
        orderBy(state: any, predicate: any[] | string[] | any[][] | Function[], order: string): {
            includes: any;
            length: any;
            toString: any;
            toLocaleString: any;
            push: any;
            pop: any;
            concat: any;
            join: any;
            reverse: any;
            shift: any;
            slice: any;
            sort: any;
            splice: any;
            unshift: any;
            indexOf: any;
            lastIndexOf: any;
            every: any;
            some: any;
            forEach: any;
            map: any;
            filter: any;
            reduce: any;
            reduceRight: any;
            [Symbol.unscopables]: any;
            [Symbol.iterator]: any;
            entries: any;
            keys: any;
            values: any;
            find: any;
            findIndex: any;
            fill: any;
            copyWithin: any;
        }[];
        findAll(state: any): any;
    };
    reducers: (state: any, action: any) => any;
};
export default createAPIResource;
