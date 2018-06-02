[![Build Status](https://travis-ci.org/jonathonherbert/redux-crud-api.svg?branch=master)](https://travis-ci.org/jonathonherbert/redux-crud-api)
[![Coverage Status](https://coveralls.io/repos/github/jsherbert/redux-crud-api/badge.svg?branch=master)](https://coveralls.io/github/jsherbert/redux-crud-api?branch=master)

# redux-crud-api

### Boilerplate-free CRUD API operations with Redux

Redux is great. But the boilerplate can be verbose and become un-DRY, and handling side-effects can be complex. Shouldn't making API requests and interacting with the resulting application state be easy?

```js

// In a redux module
export default createAPIResource({
	resourceName: 'books',
	baseUrl: config.API_BASE_URL,
})

// In your smart component
import { actions } from '@modules/bookResource'
const mapDispatchToProps = dispatch => {
	fetchBooks(): {
		// Makes a GET request to ${baseUrl}/books, and adds the returned data to the application state
		dispatch(actions.fetch()).then(books => {
			// Do something immediately with the data
		})
	}
}

```

**redux-crud-api** an attempt to produce an out-of-the-box solution for querying APIs and storing the resulting data, with conventions that are good enough for the majority of use cases, and configuration options when those conventions don't fit.

It's been pulled from a live project, and as a result it's quite opinionated about the ecosystem the module consumer is using - you'll need the redux-saga and redux-batched-actions middleware, and it uses redux-crud behind the scenes to persist data.

More documentation to follow - pull requests or discussions are welcome!

### Roadmap / Wishlist

* Prebound dispatch calls (configurable) by default, to save binding actions when they're called
* Pagination
* Saving server order, keyed by request
* Removing the dependency on redux-batched-actions

