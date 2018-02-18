"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var noop_1 = require("lodash/noop");
var redux_actions_1 = require("redux-actions");
var metaCreator = function (_, resolve, reject) {
    if (resolve === void 0) { resolve = noop_1.default; }
    if (reject === void 0) { reject = noop_1.default; }
    return ({ resolve: resolve, reject: reject });
};
exports.createPromiseAction = function (type, payloadCreator) { return redux_actions_1.createAction(type, payloadCreator, metaCreator); };
exports.bindActionToPromise = function (dispatch, actionCreator) { return function (payload) {
    return new Promise(function (resolve, reject) { return dispatch(actionCreator(payload, resolve, reject)); });
}; };
//# sourceMappingURL=saga.js.map