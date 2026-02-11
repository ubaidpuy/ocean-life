import {
  CART_ADD_ITEM,
  CART_REMOVE_ITEM,
  CART_SAVE_SHIPPING_ADDRESS,
  CART_SAVE_PAYMENT_METHOD,
  CART_CLEAR_ITEMS,
} from '../constants/cartConstants'

export const cartReducer = (
  state = { cartItems: [], shippingAddress: {} },
  action
) => {
  switch (action.type) {
    case CART_ADD_ITEM:
      const item = action.payload

      const existItem = state.cartItems.find(
        (x) =>
          x.product === item.product &&
          (x.variationId || null) === (item.variationId || null)
      )

      if (existItem) {
        return {
          ...state,
          cartItems: state.cartItems.map((x) =>
            x.product === existItem.product &&
            (x.variationId || null) === (existItem.variationId || null)
              ? item
              : x
          ),
        }
      } else {
        return {
          ...state,
          cartItems: [...state.cartItems, item],
        }
      }
    case CART_REMOVE_ITEM:
      // Backward compatibility: payload may be productId (string) or object
      if (typeof action.payload === 'string') {
        return {
          ...state,
          cartItems: state.cartItems.filter(
            (x) => x.product !== action.payload
          ),
        }
      } else {
        const { product, variationId } = action.payload
        return {
          ...state,
          cartItems: state.cartItems.filter(
            (x) =>
              !(
                x.product === product &&
                (x.variationId || null) === (variationId || null)
              )
          ),
        }
      }
    case CART_SAVE_SHIPPING_ADDRESS:
      return {
        ...state,
        shippingAddress: action.payload,
      }
    case CART_SAVE_PAYMENT_METHOD:
      return {
        ...state,
        paymentMethod: action.payload,
      }
    case CART_CLEAR_ITEMS:
      return {
        ...state,
        cartItems: [],
      }
    default:
      return state
  }
}
