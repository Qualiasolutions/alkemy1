// Re-export unified button for backward compatibility
// This preserves all existing imports and adds enhanced features
export { Button, type ButtonProps, buttonVariants } from './ui/button'

import React from 'react'
// Map old variant names to new ones for compatibility
import { Button as UnifiedButton, type ButtonProps as UnifiedButtonProps } from './ui/button'

// Wrapper for backward compatibility with old variant names
const ButtonCompat = React.forwardRef<HTMLButtonElement, UnifiedButtonProps>((props, ref) => {
  // Map 'danger' variant to 'destructive'
  const mappedProps = {
    ...props,
    variant: props.variant === ('danger' as any) ? 'destructive' : props.variant,
    size: props.size === ('md' as any) ? 'default' : props.size,
  }

  return <UnifiedButton ref={ref} {...mappedProps} />
})

ButtonCompat.displayName = 'Button'

export default ButtonCompat
