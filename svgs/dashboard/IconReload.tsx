import * as React from "react"
import { memo } from "react"
import Svg, { Path, SvgProps } from "react-native-svg"

const IconReloadMemo = ({
  ...props
}: SvgProps) => (
  <Svg
    fill="none"
    viewBox="0 0 24 24"
    width={24}
    height={24}
    {...props}
  >
    <Path
      fill={props.fill}
      fillRule="evenodd"
      d="M13.707 1.293a1 1 0 0 1 0 1.414L12.405 4.01A9 9 0 1 1 3 13a1 1 0 1 1 2 0 7 7 0 1 0 7.427-6.987l1.28 1.28a1 1 0 0 1-1.414 1.414l-3-3a1 1 0 0 1 0-1.414l3-3a1 1 0 0 1 1.414 0Z"
      clipRule="evenodd"
    />
  </Svg>
)
const IconReload = memo(IconReloadMemo)
export default IconReload
