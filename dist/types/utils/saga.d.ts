import Actions from 'redux-actions';
export declare const createPromiseAction: (type: any, payloadCreator: any) => Actions.ActionFunctionAny<Actions.ActionMeta<{}, {
    resolve: (...args: any[]) => void;
    reject: (...args: any[]) => void;
}>>;
export declare const bindActionToPromise: (dispatch: (action: any) => any, actionCreator: (payload: any, resolve: any, reject: any) => any) => (payload: any) => Promise<{}>;
