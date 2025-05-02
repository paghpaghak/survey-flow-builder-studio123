import * as React from "react"

const MOBILE_BREAKPOINT = 768

/**
 * <summary>
 * Хук для определения, находится ли пользователь на мобильном устройстве (по ширине экрана).
 * </summary>
 * <returns>Булево значение: true — мобильное устройство, false — десктоп</returns>
 */
export function useIsMobile() {
  const [isMobile, setIsMobile] = React.useState<boolean | undefined>(undefined)

  React.useEffect(() => {
    const mql = window.matchMedia(`(max-width: ${MOBILE_BREAKPOINT - 1}px)`)
    const onChange = () => {
      setIsMobile(window.innerWidth < MOBILE_BREAKPOINT)
    }
    mql.addEventListener("change", onChange)
    setIsMobile(window.innerWidth < MOBILE_BREAKPOINT)
    return () => mql.removeEventListener("change", onChange)
  }, [])

  return !!isMobile
}
