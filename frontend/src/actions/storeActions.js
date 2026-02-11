import axios from '../utils/axiosConfig'
import {
  STORE_CREATE_REQUEST,
  STORE_CREATE_SUCCESS,
  STORE_CREATE_FAIL,
  STORE_DETAILS_REQUEST,
  STORE_DETAILS_SUCCESS,
  STORE_DETAILS_FAIL,
  STORE_DASHBOARD_REQUEST,
  STORE_DASHBOARD_SUCCESS,
  STORE_DASHBOARD_FAIL,
} from '../constants/storeConstants'

export const createStore = (storeData) => async (dispatch) => {
  try {
    dispatch({
      type: STORE_CREATE_REQUEST,
    })

    const config = {
      headers: {
        'Content-Type': 'application/json',
      },
    }

    const { data } = await axios.post('/api/stores', storeData, config)

    dispatch({
      type: STORE_CREATE_SUCCESS,
      payload: data,
    })
  } catch (error) {
    dispatch({
      type: STORE_CREATE_FAIL,
      payload:
        error.response && error.response.data.message
          ? error.response.data.message
          : error.message,
    })
  }
}

export const getStoreDetails = (subdomain) => async (dispatch) => {
  try {
    dispatch({
      type: STORE_DETAILS_REQUEST,
    })

    // Note: Store details are typically handled by the tenant middleware
    // This action might not be needed if store info comes from the backend automatically
    // But keeping it for potential future use
    
    dispatch({
      type: STORE_DETAILS_SUCCESS,
      payload: { subdomain },
    })
  } catch (error) {
    dispatch({
      type: STORE_DETAILS_FAIL,
      payload:
        error.response && error.response.data.message
          ? error.response.data.message
          : error.message,
    })
  }
}

export const getStoreDashboard = () => async (dispatch, getState) => {
  try {
    dispatch({
      type: STORE_DASHBOARD_REQUEST,
    })

    const {
      userLogin: { userInfo },
    } = getState()

    const config = {
      headers: {
        Authorization: `Bearer ${userInfo.token}`,
      },
    }

    const { data } = await axios.get('/api/stores/dashboard', config)

    dispatch({
      type: STORE_DASHBOARD_SUCCESS,
      payload: data,
    })
  } catch (error) {
    dispatch({
      type: STORE_DASHBOARD_FAIL,
      payload:
        error.response && error.response.data.message
          ? error.response.data.message
          : error.message,
    })
  }
}

