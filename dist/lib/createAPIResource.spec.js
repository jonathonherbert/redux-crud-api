"use strict";
var __assign = (this && this.__assign) || Object.assign || function(t) {
    for (var s, i = 1, n = arguments.length; i < n; i++) {
        s = arguments[i];
        for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
            t[p] = s[p];
    }
    return t;
};
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g;
    return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (_) try {
            if (f = 1, y && (t = y[op[0] & 2 ? "return" : op[0] ? "throw" : "next"]) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [0, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
Object.defineProperty(exports, "__esModule", { value: true });
var _a;
var _this = this;
var normalizr_1 = require("normalizr");
var redux_batched_actions_1 = require("redux-batched-actions");
var fetch_mock_1 = require("fetch-mock");
require("whatwg-fetch");
var redux_mock_store_1 = require("redux-mock-store");
var redux_thunk_1 = require("redux-thunk");
var createAPIResource_1 = require("./createAPIResource");
var baseUrl = "/api";
var resourceName = "model";
var errorMessage = "HTTP Error: 400";
var mockStore = redux_mock_store_1.default([redux_thunk_1.default]);
var resource = {
    id: 1,
    exampleData: "exampleData",
    exampleJson: '{"key":"value"}',
    relations: [
        {
            id: 1,
            name: "relation1"
        },
        {
            id: 2,
            name: "relation2"
        }
    ]
};
var state = (_a = {},
    _a[resourceName] = {
        records: {
            1: {
                id: 1,
                name: "example1"
            },
            2: {
                id: 2,
                name: "example2"
            },
            3: {
                id: 3,
                name: "example3"
            },
            4: {
                id: 4,
                _cid: "exampleCid",
                name: "clientGeneratedExample4"
            }
        }
    },
    _a);
var response = {
    data: resource
};
var arrayResponse = {
    data: [resource]
};
var responseNoEnvelope = [resource];
var invalidAPIResponse = {
    status: 400
};
var transformOut = function (localResource) {
    return __assign({}, localResource, { exampleJson: JSON.stringify(localResource.exampleJson) });
};
var transformIn = function (localResource) {
    return __assign({}, localResource, { exampleJson: JSON.parse(localResource.exampleJson) });
};
var relationSchema = new normalizr_1.schema.Entity("relation");
var modelSchema = new normalizr_1.schema.Entity("model", {
    relations: [relationSchema]
});
var normalisedModelData = normalizr_1.normalize(resource, modelSchema);
var reducer = createAPIResource_1.createReducer(resourceName);
// Unnormalised data
var modelResource = createAPIResource_1.default({ resourceName: resourceName, baseUrl: baseUrl });
var modelResourceWithTransforms = createAPIResource_1.default({
    resourceName: resourceName,
    baseUrl: baseUrl,
    options: { transformIn: transformIn, transformOut: transformOut }
});
var actionCreators = createAPIResource_1.createActionCreators(resourceName);
// Normalised data
var relationActionCreators = createAPIResource_1.createActionCreators(resourceName);
var relationResource = createAPIResource_1.default({
    resourceName: resourceName,
    baseUrl: baseUrl,
    relations: {
        schema: modelSchema,
        map: { relation: relationActionCreators }
    }
});
describe("createAPIResource", function () {
    var _now = Date.now;
    beforeAll(function () {
        Date.now = jest.fn(function () { return 1337; });
    });
    afterAll(function () {
        Date.now = _now;
    });
    describe("createAPIResource", function () {
        it("should throw if asked to instantiate with invalid actions", function () {
            expect(function () {
                return createAPIResource_1.default({ resourceName: resourceName, baseUrl: baseUrl, actions: ["invalid"] });
            }).toThrowError("not supported");
        });
    });
    describe("Action names", function () {
        it("should provide the relevant action names to the consumer", function () {
            expect(modelResource.actionNames.createError).toEqual("MODEL_CREATE_ERROR");
            expect(modelResource.actionNames.MODEL_CREATE_ERROR).toEqual("MODEL_CREATE_ERROR");
        });
    });
    describe("Reducer", function () {
        it("should add a lastFetch time when consuming SUCCESS actions", function () {
            expect(reducer(undefined, actionCreators.fetchSuccess(resource)).lastFetch).toBe(1337);
        });
    });
    describe("Selectors", function () {
        it("should have a selector that fetches models by id", function () {
            expect(modelResource.selectors.findById(state, 1)).toEqual(state[resourceName].records[1]);
        });
        it("should have a selector that fetches models by cid", function () {
            expect(modelResource.selectors.findByCid(state, "exampleCid")).toEqual(state[resourceName].records[4]);
        });
        it("should have a selector that filters by predicate", function () {
            expect(modelResource.selectors.filter(state, function (item) { return item.id > 2; }).length).toBe(2);
            expect(modelResource.selectors.filter(state, function (item) { return item.name.includes("example"); }).length).toBe(3);
        });
        it("should have a selector that orders by iteratee and direction", function () {
            expect(modelResource.selectors.orderBy(state, "id", "asc").map(function (record) { return record.id; })).toEqual([1, 2, 3, 4]);
            expect(modelResource.selectors.orderBy(state, "id", "desc").map(function (record) { return record.id; })).toEqual([4, 3, 2, 1]);
        });
        it("should have a selector that returns all of the things", function () {
            expect(modelResource.selectors.findAll(state)).toEqual(state[resourceName].records);
        });
        it("should have a selector that returns the last fetch time", function () {
            expect(modelResource.selectors.lastFetch({
                model: {
                    records: {
                        1: { busy: true }
                    },
                    lastFetch: 1337
                }
            })).toBe(1337);
        });
        it("should have a selector that returns if a record is marked busy", function () {
            expect(modelResource.selectors.isBusy({
                model: {
                    records: {
                        1: { busy: true }
                    }
                }
            }, 1)).toBe(true);
            expect(modelResource.selectors.isBusy({
                model: {
                    records: {
                        1: { busy: false }
                    }
                }
            }, 1)).toBe(false);
        });
        it("should have a selector that returns if a record is marked pendingUpdate", function () {
            expect(modelResource.selectors.isPendingUpdate({
                model: {
                    records: {
                        1: { pendingUpdate: true }
                    }
                }
            }, 1)).toBe(true);
            expect(modelResource.selectors.isPendingUpdate({
                model: {
                    records: {
                        1: { pendingUpdate: false }
                    }
                }
            }, 1)).toBe(false);
        });
        it("should have a selector that returns if a record is marked pendingCreate", function () {
            expect(modelResource.selectors.isPendingCreate({
                model: {
                    records: {
                        1: { pendingCreate: true }
                    }
                }
            }, 1)).toBe(true);
            expect(modelResource.selectors.isPendingCreate({
                model: {
                    records: {
                        1: { pendingCreate: false }
                    }
                }
            }, 1)).toBe(false);
        });
        it("should have a selector that returns if any record is busy", function () {
            expect(modelResource.selectors.isResourceBusy({
                model: {
                    records: {
                        1: { busy: true }
                    }
                }
            }, 1)).toBe(true);
            expect(modelResource.selectors.isResourceBusy({
                model: {
                    records: {
                        1: { busy: true },
                        2: { busy: false }
                    }
                }
            }, 1)).toBe(true);
            expect(modelResource.selectors.isResourceBusy({
                model: {
                    records: {
                        1: { busy: false },
                        2: { busy: false }
                    }
                }
            }, 1)).toBe(false);
        });
    });
    describe("Actions", function () {
        beforeEach(fetch_mock_1.default.restore);
        describe("Fetch worker", function () {
            it("makes fetch requests and handles valid array responses", function () { return __awaiter(_this, void 0, void 0, function () {
                var store, actions;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0:
                            store = mockStore();
                            fetch_mock_1.default.mock("/api/model/1", arrayResponse);
                            return [4 /*yield*/, store.dispatch(modelResource.thunks.fetch({ resource: resource }))];
                        case 1:
                            _a.sent();
                            actions = store.getActions();
                            expect(actions[0]).toEqual(actionCreators.fetchStart(resource));
                            expect(actions[1]).toEqual(actionCreators.fetchSuccess(arrayResponse.data));
                            return [2 /*return*/];
                    }
                });
            }); });
            it("makes fetch requests and applies transforms", function () { return __awaiter(_this, void 0, void 0, function () {
                var store, result, actions;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0:
                            store = mockStore();
                            fetch_mock_1.default.mock("/api/model/1", arrayResponse);
                            return [4 /*yield*/, store.dispatch(modelResourceWithTransforms.thunks.fetch({ resource: resource }))];
                        case 1:
                            result = _a.sent();
                            actions = store.getActions();
                            expect(actions[0]).toEqual(actionCreators.fetchStart(resource));
                            expect(actions[1]).toEqual(actionCreators.fetchSuccess(arrayResponse.data.map(function (data) { return transformIn(data); })));
                            // Resolve the caller Promise via the action meta, which should also return transformed data
                            expect(result).toEqual(arrayResponse.data.map(function (data) { return transformIn(data); }));
                            return [2 /*return*/];
                    }
                });
            }); });
            it("makes fetch requests and handles responses without an envelope", function () { return __awaiter(_this, void 0, void 0, function () {
                var store, actions;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0:
                            store = mockStore();
                            fetch_mock_1.default.mock("/api/model/1", responseNoEnvelope);
                            return [4 /*yield*/, store.dispatch(modelResource.thunks.fetch({ resource: resource }))];
                        case 1:
                            _a.sent();
                            actions = store.getActions();
                            expect(actions[0]).toEqual(actionCreators.fetchStart(resource));
                            expect(actions[1]).toEqual(actionCreators.fetchSuccess(responseNoEnvelope));
                            return [2 /*return*/];
                    }
                });
            }); });
            it("makes fetch requests and makes appropriate calls if relations are defined", function () { return __awaiter(_this, void 0, void 0, function () {
                var store, actions;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0:
                            store = mockStore();
                            fetch_mock_1.default.mock("/api/model/1", arrayResponse);
                            return [4 /*yield*/, store.dispatch(relationResource.thunks.fetch({ resource: resource }))];
                        case 1:
                            _a.sent();
                            actions = store.getActions();
                            expect(actions[0]).toEqual(actionCreators.fetchStart(resource));
                            // The first dispatched action should be the normalised relation data
                            expect(actions[1]).toEqual(redux_batched_actions_1.batchActions([
                                actionCreators.fetchSuccess(normalisedModelData.entities.relation[1]),
                                actionCreators.fetchSuccess(normalisedModelData.entities.relation[2])
                            ]));
                            // And the next should be the normalised model data
                            expect(actions[2]).toEqual(redux_batched_actions_1.batchActions([actionCreators.fetchSuccess(normalisedModelData.entities.model[1])]));
                            return [2 /*return*/];
                    }
                });
            }); });
            it("makes fetch requests and handles errors", function () { return __awaiter(_this, void 0, void 0, function () {
                var store, e_1, actions;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0:
                            store = mockStore();
                            fetch_mock_1.default.mock("/api/model/1", 400);
                            expect.assertions(3);
                            _a.label = 1;
                        case 1:
                            _a.trys.push([1, 3, , 4]);
                            return [4 /*yield*/, store.dispatch(modelResource.thunks.fetch({ resource: resource }))];
                        case 2:
                            _a.sent();
                            return [3 /*break*/, 4];
                        case 3:
                            e_1 = _a.sent();
                            expect(e_1.message).toContain("400");
                            return [3 /*break*/, 4];
                        case 4:
                            actions = store.getActions();
                            expect(actions[0]).toEqual(actionCreators.fetchStart(resource));
                            expect(actions[1]).toEqual(actionCreators.fetchError(errorMessage));
                            return [2 /*return*/];
                    }
                });
            }); });
            it("makes requests with bearer auth if a selector is supplied", function () { return __awaiter(_this, void 0, void 0, function () {
                var store, selectAuthToken, modelResourceWithAuth, actions;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0:
                            store = mockStore();
                            selectAuthToken = function () { return "token"; };
                            modelResourceWithAuth = createAPIResource_1.default({
                                resourceName: resourceName,
                                baseUrl: baseUrl,
                                selectAuthToken: selectAuthToken
                            });
                            fetch_mock_1.default.mock("/api/model/1", arrayResponse);
                            return [4 /*yield*/, store.dispatch(modelResourceWithAuth.thunks.fetch({ resource: resource }))];
                        case 1:
                            _a.sent();
                            actions = store.getActions();
                            expect(actions[0]).toEqual(actionCreators.fetchStart(resource));
                            expect(actions[1]).toEqual(actionCreators.fetchSuccess(arrayResponse.data));
                            expect(fetch_mock_1.default.lastCall()[1].headers).toEqual(new Headers({
                                Authorization: "Bearer token"
                            }));
                            return [2 /*return*/];
                    }
                });
            }); });
            it("makes fetch requests to arbitrary endpoints", function () { return __awaiter(_this, void 0, void 0, function () {
                var store, actions;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0:
                            store = mockStore();
                            fetch_mock_1.default.mock("/api/recent/1", arrayResponse);
                            return [4 /*yield*/, store.dispatch(modelResource.thunks.fetch({
                                    resource: resource,
                                    options: { endpoint: "recent" }
                                }))];
                        case 1:
                            _a.sent();
                            actions = store.getActions();
                            expect(actions[0]).toEqual(actionCreators.fetchStart(resource));
                            expect(actions[1]).toEqual(actionCreators.fetchSuccess(arrayResponse.data));
                            return [2 /*return*/];
                    }
                });
            }); });
        });
        describe("Update worker", function () {
            it("makes update requests and handles valid responses", function () { return __awaiter(_this, void 0, void 0, function () {
                var store, actions;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0:
                            store = mockStore({
                                model: {
                                    records: { 1: {} }
                                }
                            });
                            fetch_mock_1.default.mock("/api/model/1", response, { method: "PUT" });
                            return [4 /*yield*/, store.dispatch(modelResource.thunks.update({ resource: resource }))];
                        case 1:
                            _a.sent();
                            actions = store.getActions();
                            expect(actions[0]).toEqual(actionCreators.updateStart(resource));
                            expect(actions[1]).toEqual(actionCreators.updateSuccess(response.data));
                            return [2 /*return*/];
                    }
                });
            }); });
            it("makes update requests and merges existing model with updates", function () { return __awaiter(_this, void 0, void 0, function () {
                var store, actions;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0:
                            store = mockStore({
                                model: {
                                    records: {
                                        1: __assign({}, resource, { isMerged: true })
                                    }
                                }
                            });
                            fetch_mock_1.default.mock(function (url, opts) {
                                // Body doesn't exist on the typings here, but it should!
                                expect(opts.body).toBe(JSON.stringify(__assign({}, resource, { isMerged: true })));
                                return url === "/api/model/1";
                            }, response, { method: "PUT" });
                            return [4 /*yield*/, store.dispatch(modelResource.thunks.update({ resource: resource }))];
                        case 1:
                            _a.sent();
                            actions = store.getActions();
                            expect(actions[0]).toEqual(actionCreators.updateStart(__assign({}, resource, { isMerged: true })));
                            return [2 /*return*/];
                    }
                });
            }); });
            it("should throw if the model being updated cannot be found in the local state", function () { return __awaiter(_this, void 0, void 0, function () {
                var store;
                return __generator(this, function (_a) {
                    store = mockStore();
                    return [2 /*return*/, expect(function () { return store.dispatch(modelResource.thunks.update({ resource: resource })); }).rejects];
                });
            }); });
            it("makes update requests and apply transformations", function () { return __awaiter(_this, void 0, void 0, function () {
                var store, actions;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0:
                            store = mockStore({
                                model: {
                                    records: {
                                        1: resource
                                    }
                                }
                            });
                            fetch_mock_1.default.mock(function (url, opts) {
                                // Body doesn't exist on the typings here, but it should!
                                expect(opts.body).toBe(JSON.stringify(transformOut(resource)));
                                return url === "/api/model/1";
                            }, response, { method: "PUT" });
                            return [4 /*yield*/, store.dispatch(modelResourceWithTransforms.thunks.update({ resource: resource }))];
                        case 1:
                            _a.sent();
                            actions = store.getActions();
                            expect(actions[0]).toEqual(actionCreators.updateStart(resource));
                            return [2 /*return*/];
                    }
                });
            }); });
            it("makes update requests and applies relations on optimistic update", function () { return __awaiter(_this, void 0, void 0, function () {
                var store, actions;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0:
                            store = mockStore({
                                model: {
                                    records: {
                                        1: resource
                                    }
                                }
                            });
                            fetch_mock_1.default.mock(function (url, opts) {
                                // Body doesn't exist on the typings here, but it should!
                                expect(opts.body).toBe(JSON.stringify(resource));
                                return url === "/api/model/1";
                            }, response, { method: "PUT" });
                            return [4 /*yield*/, store.dispatch(relationResource.thunks.update({ resource: resource }))];
                        case 1:
                            _a.sent();
                            actions = store.getActions();
                            // We expect the resource to update the relations and the model optimistically
                            expect(actions[0]).toEqual(redux_batched_actions_1.batchActions([
                                relationActionCreators.updateStart(normalisedModelData.entities.relation[1]),
                                relationActionCreators.updateStart(normalisedModelData.entities.relation[2])
                            ]));
                            expect(actions[1]).toEqual(redux_batched_actions_1.batchActions([actionCreators.updateStart(normalisedModelData.entities.model[1])]));
                            expect(actions[2]).toEqual(redux_batched_actions_1.batchActions([
                                actionCreators.updateSuccess(normalisedModelData.entities.relation[1], "1"),
                                actionCreators.updateSuccess(normalisedModelData.entities.relation[2], "2")
                            ]));
                            expect(actions[3]).toEqual(redux_batched_actions_1.batchActions([actionCreators.updateSuccess(normalisedModelData.entities.model[1], "1")]));
                            return [2 /*return*/];
                    }
                });
            }); });
            it("makes update requests and handles errors", function () { return __awaiter(_this, void 0, void 0, function () {
                var store, e_2, actions;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0:
                            store = mockStore({
                                model: {
                                    records: {
                                        1: resource
                                    }
                                }
                            });
                            fetch_mock_1.default.mock("/api/model/1", 400, { method: "PUT" });
                            _a.label = 1;
                        case 1:
                            _a.trys.push([1, 3, , 4]);
                            return [4 /*yield*/, store.dispatch(modelResource.thunks.update({ resource: resource }))];
                        case 2:
                            _a.sent();
                            return [3 /*break*/, 4];
                        case 3:
                            e_2 = _a.sent();
                            expect(e_2.message).toContain("400");
                            return [3 /*break*/, 4];
                        case 4:
                            actions = store.getActions();
                            expect(actions[0]).toEqual(actionCreators.updateStart(resource));
                            expect(actions[1]).toEqual(actionCreators.updateError(errorMessage, resource));
                            return [2 /*return*/];
                    }
                });
            }); });
        });
        describe("Create worker", function () {
            it("makes create requests and handles valid responses", function () { return __awaiter(_this, void 0, void 0, function () {
                var store, actions;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0:
                            store = mockStore();
                            fetch_mock_1.default.mock(function (url, options) {
                                var bodyContent = Object.assign({}, resource);
                                delete bodyContent.id;
                                expect(options.body).toEqual(JSON.stringify(bodyContent));
                                return url === "/api/model";
                            }, resource, { method: "POST" });
                            return [4 /*yield*/, store.dispatch(modelResource.thunks.create({ resource: __assign({}, resource, { id: "cid" }) }))];
                        case 1:
                            _a.sent();
                            actions = store.getActions();
                            expect(actions[1]).toEqual(actionCreators.createSuccess(resource, "cid"));
                            return [2 /*return*/];
                    }
                });
            }); });
            it("makes create requests and handles errors", function () { return __awaiter(_this, void 0, void 0, function () {
                var store, e_3, actions;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0:
                            store = mockStore();
                            fetch_mock_1.default.mock(function (url, options) {
                                var bodyContent = Object.assign({}, resource);
                                delete bodyContent.id;
                                expect(options.body).toEqual(JSON.stringify(bodyContent));
                                return url === "/api/model";
                            }, invalidAPIResponse, { method: "POST" });
                            _a.label = 1;
                        case 1:
                            _a.trys.push([1, 3, , 4]);
                            return [4 /*yield*/, store.dispatch(modelResource.thunks.create({ resource: __assign({}, resource, { id: "cid" }) }))];
                        case 2:
                            _a.sent();
                            return [3 /*break*/, 4];
                        case 3:
                            e_3 = _a.sent();
                            expect(e_3.message).toContain("400");
                            return [3 /*break*/, 4];
                        case 4:
                            actions = store.getActions();
                            expect(actions[1]).toEqual(actionCreators.createError(errorMessage, __assign({}, resource, { id: "cid" })));
                            return [2 /*return*/];
                    }
                });
            }); });
        });
        describe("Delete worker", function () {
            it("Creates delete requests and handles valid responses", function () { return __awaiter(_this, void 0, void 0, function () {
                var store, actions;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0:
                            store = mockStore({
                                model: {
                                    1: resource
                                }
                            });
                            fetch_mock_1.default.mock("/api/model/1", 200, { method: "DELETE" });
                            return [4 /*yield*/, store.dispatch(modelResource.thunks.del({ resource: resource }))];
                        case 1:
                            _a.sent();
                            actions = store.getActions();
                            expect(actions[0]).toEqual(actionCreators.deleteStart(resource));
                            expect(actions[1]).toEqual(actionCreators.deleteSuccess(resource));
                            return [2 /*return*/];
                    }
                });
            }); });
            it("Creates delete requests and handles errors", function () { return __awaiter(_this, void 0, void 0, function () {
                var store, e_4, actions;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0:
                            store = mockStore({
                                model: {
                                    1: resource
                                }
                            });
                            fetch_mock_1.default.mock("/api/model/1", 400, { method: "DELETE" });
                            _a.label = 1;
                        case 1:
                            _a.trys.push([1, 3, , 4]);
                            return [4 /*yield*/, store.dispatch(modelResource.thunks.del({ resource: resource }))];
                        case 2:
                            _a.sent();
                            return [3 /*break*/, 4];
                        case 3:
                            e_4 = _a.sent();
                            expect(e_4.message).toContain("400");
                            return [3 /*break*/, 4];
                        case 4:
                            actions = store.getActions();
                            expect(actions[0]).toEqual(actionCreators.deleteStart(resource));
                            expect(actions[1]).toEqual(actionCreators.deleteError(errorMessage, resource));
                            return [2 /*return*/];
                    }
                });
            }); });
            it("Creates delete requests and doesn't apply transforms to local data", function () { return __awaiter(_this, void 0, void 0, function () {
                var store, actions;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0:
                            store = mockStore({
                                model: {
                                    1: resource
                                }
                            });
                            fetch_mock_1.default.mock("/api/model/1", 200, { method: "DELETE" });
                            return [4 /*yield*/, store.dispatch(modelResourceWithTransforms.thunks.del({ resource: resource }))];
                        case 1:
                            _a.sent();
                            actions = store.getActions();
                            expect(actions[0]).toEqual(actionCreators.deleteStart(resource));
                            expect(actions[1]).toEqual(actionCreators.deleteSuccess(resource));
                            return [2 /*return*/];
                    }
                });
            }); });
        });
        describe("Search worker", function () {
            it("Creates search requests and handles valid responses", function () { return __awaiter(_this, void 0, void 0, function () {
                var searchParams, searchResponse, store, actions;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0:
                            searchParams = {
                                dateFrom: "01/12/2016",
                                dateTo: "02/12/2016"
                            };
                            searchResponse = {
                                data: [
                                    {
                                        id: 1,
                                        exampleData: "exampleData"
                                    }
                                ]
                            };
                            store = mockStore();
                            fetch_mock_1.default.mock("/api/model", searchResponse);
                            return [4 /*yield*/, store.dispatch(modelResource.thunks.fetch({ resource: searchParams }))];
                        case 1:
                            _a.sent();
                            actions = store.getActions();
                            expect(actions[0]).toEqual(actionCreators.fetchStart(searchParams));
                            expect(actions[1]).toEqual(actionCreators.fetchSuccess(searchResponse.data));
                            return [2 /*return*/];
                    }
                });
            }); });
            it("Creates search requests and normalises responses", function () { return __awaiter(_this, void 0, void 0, function () {
                var searchParams, store, actions;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0:
                            searchParams = {
                                dateFrom: "01/12/2016",
                                dateTo: "02/12/2016"
                            };
                            store = mockStore();
                            fetch_mock_1.default.mock("/api/model", response);
                            return [4 /*yield*/, store.dispatch(relationResource.thunks.fetch({ resource: searchParams }))];
                        case 1:
                            _a.sent();
                            actions = store.getActions();
                            expect(actions[0]).toEqual(actionCreators.fetchStart(searchParams));
                            expect(actions[1]).toEqual(redux_batched_actions_1.batchActions([
                                actionCreators.fetchSuccess(normalisedModelData.entities.relation[1]),
                                actionCreators.fetchSuccess(normalisedModelData.entities.relation[2])
                            ]));
                            expect(actions[2]).toEqual(redux_batched_actions_1.batchActions([actionCreators.fetchSuccess(normalisedModelData.entities.model[1])]));
                            return [2 /*return*/];
                    }
                });
            }); });
            it("Creates search requests and handles errors", function () { return __awaiter(_this, void 0, void 0, function () {
                var searchParams, store, e_5, actions;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0:
                            searchParams = {
                                dateFrom: "01/12/2016",
                                dateTo: "02/12/2016"
                            };
                            store = mockStore();
                            fetch_mock_1.default.mock("/api/model", 400);
                            _a.label = 1;
                        case 1:
                            _a.trys.push([1, 3, , 4]);
                            return [4 /*yield*/, store.dispatch(relationResource.thunks.fetch({ resource: searchParams }))];
                        case 2:
                            _a.sent();
                            return [3 /*break*/, 4];
                        case 3:
                            e_5 = _a.sent();
                            expect(e_5.message).toContain("400");
                            return [3 /*break*/, 4];
                        case 4:
                            actions = store.getActions();
                            expect(actions[0]).toEqual(actionCreators.fetchStart(searchParams));
                            expect(actions[1]).toEqual(actionCreators.fetchError(errorMessage));
                            return [2 /*return*/];
                    }
                });
            }); });
        });
    });
});
//# sourceMappingURL=createAPIResource.spec.js.map