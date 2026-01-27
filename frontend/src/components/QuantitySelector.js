import React from 'react'
import { Button } from 'react-bootstrap'

const QuantitySelector = ({ qty, onQtyChange, maxStock, disabled }) => {
  const handleDecrease = () => {
    if (qty > 1) {
      onQtyChange(qty - 1)
    }
  }

  const handleIncrease = () => {
    if (qty < maxStock) {
      onQtyChange(qty + 1)
    }
  }

  return (
    <div className='quantity-selector'>
      <Button
        variant='outline-secondary'
        className='quantity-btn quantity-btn-minus'
        onClick={handleDecrease}
        disabled={qty <= 1 || disabled}
        aria-label='Decrease quantity'
      >
        <i className='fas fa-minus'></i>
      </Button>
      <span className='quantity-value'>{qty}</span>
      <Button
        variant='outline-secondary'
        className='quantity-btn quantity-btn-plus'
        onClick={handleIncrease}
        disabled={qty >= maxStock || disabled}
        aria-label='Increase quantity'
      >
        <i className='fas fa-plus'></i>
      </Button>
    </div>
  )
}

export default QuantitySelector

