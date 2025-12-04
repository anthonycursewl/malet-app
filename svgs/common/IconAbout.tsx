import * as React from "react"
import { memo } from "react"
import Svg, { G, Path, SvgProps } from "react-native-svg"
const IconAboutMemo = (props: SvgProps) => (
    <Svg
        fill="none"
        viewBox="0 0 24 24"
        {...props}
    >
        <G fill={props.fill}>
            <Path
                d="M3.67 2.5v11.97c0 .98.46 1.91 1.25 2.5l5.21 3.9c1.11.83 2.64.83 3.75 0l5.21-3.9c.79-.59 1.25-1.52 1.25-2.5V2.5H3.67Z"
                opacity={0.4}
            />
            <Path d="M22 3.25H2c-.41 0-.75-.34-.75-.75s.34-.75.75-.75h20c.41 0 .75.34.75.75s-.34.75-.75.75ZM16 8.75H8c-.41 0-.75-.34-.75-.75s.34-.75.75-.75h8c.41 0 .75.34.75.75s-.34.75-.75.75ZM16 13.75H8c-.41 0-.75-.34-.75-.75s.34-.75.75-.75h8c.41 0 .75.34.75.75s-.34.75-.75.75Z" />
        </G>
    </Svg>
)
const IconAbout = memo(IconAboutMemo)
export default IconAbout
