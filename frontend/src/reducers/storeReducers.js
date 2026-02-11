import {
  STORE_CREATE_REQUEST,
  STORE_CREATE_SUCCESS,
  STORE_CREATE_FAIL,
  STORE_CREATE_RESET,
  STORE_DETAILS_REQUEST,
  STORE_DETAILS_SUCCESS,
  STORE_DETAILS_FAIL,
  STORE_DASHBOARD_REQUEST,
  STORE_DASHBOARD_SUCCESS,
  STORE_DASHBOARD_FAIL,
} from '../constants/storeConstants'

export const storeCreateReducer = (state = {}, action) => {
  switch (action.type) {
    case STORE_CREATE_REQUEST:
      return { loading: true }
    case STORE_CREATE_SUCCESS:
      return { loading: false, success: true, store: action.payload }
    case STORE_CREATE_FAIL:
      return { loading: false, error: action.payload }
    case STORE_CREATE_RESET:
      return {}
    default:
      return state
  }
}

export const storeDetailsReducer = (state = { store: {} }, action) => {
  switch (action.type) {
    case STORE_DETAILS_REQUEST:
      return { ...state, loading: true }
    case STORE_DETAILS_SUCCESS:
      return { loading: false, store: action.payload }
    case STORE_DETAILS_FAIL:
      return { loading: false, error: action.payload }
    default:
      return state
  }
}

export const storeDashboardReducer = (state = { dashboard: {} }, action) => {
  switch (action.type) {
    case STORE_DASHBOARD_REQUEST:
      return { ...state, loading: true }
    case STORE_DASHBOARD_SUCCESS:
      return { loading: false, dashboard: action.payload }
    case STORE_DASHBOARD_FAIL:
      return { loading: false, error: action.payload }
    default:
      return state
  }
}


