import Svg, { Path, SvgProps } from 'react-native-svg'

export default function IconPlus({ ...props }: SvgProps) {
    return (
        <Svg
            fill="none"
            viewBox="0 0 20 20"
            {...props}
        >
            <Path
                fill={props.fill}
                fillRule="evenodd"
                d="M10 3a7 7 0 1 0 0 14 7 7 0 0 0 0-14zm-9 7a9 9 0 1 1 18 0 9 9 0 0 1-18 0zm14 .069a1 1 0 0 1-1 1h-2.931V14a1 1 0 1 1-2 0v-2.931H6a1 1 0 1 1 0-2h3.069V6a1 1 0 1 1 2 0v3.069H14a1 1 0 0 1 1 1z"
            />
        </Svg>

    )
}