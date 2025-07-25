import Svg, { Path, SvgProps } from "react-native-svg"

export default function IconMinus({ ...props }: SvgProps) {
    return (
        <Svg viewBox="0 0 32 32" {...props}>
            <Path fill={props.fill} d="M0 16q0 3.264 1.28 6.208t3.392 5.12 5.12 3.424T16 32t6.208-1.248 5.12-3.424 3.392-5.12T32 16t-1.28-6.208-3.392-5.12T22.24 1.28 16 0q-3.264 0-6.208 1.28t-5.12 3.392-3.392 5.12T0 16zm4 0q0-3.264 1.6-6.016t4.384-4.352T16 4t6.016 1.632T26.4 9.984 28 16t-1.6 6.048-4.384 4.352T16 28t-6.016-1.6T5.6 22.048 4 16zm4 0q0 .832.576 1.44t1.44.576h12q.8 0 1.408-.576T24 16t-.576-1.408-1.408-.576h-12q-.832 0-1.44.576T8 16z" />
        </Svg>
    )
}