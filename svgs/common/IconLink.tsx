import * as React from "react"
import { memo } from "react"
import Svg, { G, Path, SvgProps } from "react-native-svg"

const IconLinkMemo = (props: SvgProps) => (
    <Svg
        fill="none"
        viewBox="0 0 24 24"
        {...props}
    >
        <G fill={props.fill}>
            <Path
                d="M13.06 10.94a5.74 5.74 0 0 1 0 8.12l-2.12 2.12a5.74 5.74 0 0 1-8.12-8.12l1.65-1.65"
                opacity={0.4}
            />
            <Path
                d="M10.94 13.06a5.74 5.74 0 0 1 0-8.12l2.12-2.12a5.74 5.74 0 0 1 8.12 8.12l-1.65 1.65"
            />
            <Path
                d="M8.46 15.54l7.08-7.08"
                strokeWidth={1.5}
                stroke={props.fill}
                strokeLinecap="round"
            />
        </G>
    </Svg>
)

const IconLink = memo(IconLinkMemo)
export default IconLink
