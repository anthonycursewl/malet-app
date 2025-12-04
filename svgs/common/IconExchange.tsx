import * as React from "react"
import { memo } from "react"
import Svg, { G, Path, SvgProps } from "react-native-svg"
const IconExchangeMemo = (props: SvgProps) => (
    <Svg
        fill="none"
        viewBox="0 0 24 24"
        {...props}
    >
        <G
            stroke={props.stroke}
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
        >
            <Path d="M8 10h12l-4-4M16 14H4l4 4" />
        </G>
    </Svg>
)
const IconExchange = memo(IconExchangeMemo)
export default IconExchange
