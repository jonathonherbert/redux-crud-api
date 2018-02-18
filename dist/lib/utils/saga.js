"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const noop_1 = require("lodash/noop");
const redux_actions_1 = require("redux-actions");
const metaCreator = (_, resolve = noop_1.default, reject = noop_1.default) => ({ resolve, reject });
exports.createPromiseAction = (type, payloadCreator) => redux_actions_1.createAction(type, payloadCreator, metaCreator);
exports.bindActionToPromise = (dispatch, actionCreator) => (payload) => {
    return new Promise((resolve, reject) => dispatch(actionCreator(payload, resolve, reject)));
};
//# sourceMappingURL=saga.js.map