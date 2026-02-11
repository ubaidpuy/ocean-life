import axios from '../utils/axiosConfig'
import {
  CART_ADD_ITEM,
  CART_REMOVE_ITEM,
  CART_SAVE_SHIPPING_ADDRESS,
  CART_SAVE_PAYMENT_METHOD,
} from '../constants/cartConstants'

// variationInfo: optional { variationId, variationMeta }
export const addToCart = (id, qty, variationInfo = null) => async (
  dispatch,
  getState
) => {
  const { data } = await axios.get(`/api/products/${id}`)

  let selectedVariation = null

  if (
    variationInfo &&
    variationInfo.variationId &&
    Array.isArray(data.variations)
  ) {
    selectedVariation =
      data.variations.find((v) => v._id === variationInfo.variationId) || null
  }

  const variationMeta = selectedVariation
    ? {
        key: data.variationKey || '',
        name: data.variationName || '',
        value: selectedVariation.value || '',
        label: selectedVariation.label || selectedVariation.value || '',
      }
    : variationInfo && variationInfo.variationMeta
    ? variationInfo.variationMeta
    : null

  const price = selectedVariation ? selectedVariation.price : data.price
  const countInStock = selectedVariation
    ? selectedVariation.countInStock
    : data.countInStock

  const image =
    selectedVariation &&
    Array.isArray(selectedVariation.images) &&
    selectedVariation.images.length > 0
      ? selectedVariation.images[0]
      : data.image

  dispatch({
    type: CART_ADD_ITEM,
    payload: {
      product: data._id,
      variationId: selectedVariation ? selectedVariation._id : null,
      sku: selectedVariation ? selectedVariation.sku : null,
      variation: variationMeta,
      name: data.name,
      image,
      price,
      countInStock,
      qty,
    },
  })

  localStorage.setItem('cartItems', JSON.stringify(getState().cart.cartItems))
}

export const removeFromCart = (productId, variationId = null) => (
  dispatch,
  getState
) => {
  dispatch({
    type: CART_REMOVE_ITEM,
    payload: { product: productId, variationId: variationId || null },
  })

  localStorage.setItem('cartItems', JSON.stringify(getState().cart.cartItems))
}

export const saveShippingAddress = (data) => (dispatch) => {
  dispatch({
    type: CART_SAVE_SHIPPING_ADDRESS,
    payload: data,
  })

  localStorage.setItem('shippingAddress', JSON.stringify(data))
}

export const savePaymentMethod = (data) => (dispatch) => {
  dispatch({
    type: CART_SAVE_PAYMENT_METHOD,
    payload: data,
  })

  localStorage.setItem('paymentMethod', JSON.stringify(data))
}
